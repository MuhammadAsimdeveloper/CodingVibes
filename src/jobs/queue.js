import crypto from 'node:crypto';

function normalizeJob(input){
  const payload=input?.payload;
  if(!input?.type||typeof input.type!=='string')throw new Error('job_type_required');
  if(payload===undefined)throw new Error('job_payload_required');
  if(Buffer.byteLength(JSON.stringify(payload),'utf8')>256*1024)throw new Error('job_payload_too_large');
  return {id:String(input.id||crypto.randomUUID()),type:String(input.type).slice(0,120),payload,attempt:Number.isFinite(Number(input.attempt))?Math.max(0,Math.floor(Number(input.attempt))):0,enqueuedAt:String(input.enqueuedAt||new Date().toISOString()),idempotencyKey:input.idempotencyKey?String(input.idempotencyKey).slice(0,200):null};
}
function decodeFields(fields=[]){const out={};for(let i=0;i<fields.length;i+=2)out[fields[i]]=fields[i+1];return out;}

export class RedisJobQueue{
 constructor(client,{stream='build-vibe:jobs',group='workers',consumer=process.env.HOSTNAME||('worker-'+process.pid),maxLen=10000,deadLetterStream=null,idempotencyTtlSec=86400}={}){this.client=client;this.stream=stream;this.group=group;this.consumer=consumer;this.maxLen=maxLen;this.deadLetterStream=deadLetterStream||stream+':dlq';this.idempotencyTtlSec=Math.max(60,Number(idempotencyTtlSec)||86400);}
 async init(){try{await this.client.xgroup('CREATE',this.stream,this.group,'0','MKSTREAM');}catch(error){if(!String(error?.message||error).includes('BUSYGROUP'))throw error;}return this;}
 async enqueue(job){const value=normalizeJob(job);if(value.idempotencyKey){const claimed=await this.client.set('build-vibe:idempotency:'+value.idempotencyKey,'1','NX','EX',this.idempotencyTtlSec);if(claimed===null)return value;}const streamId=await this.client.xadd(this.stream,'MAXLEN','~',this.maxLen,'*','job',JSON.stringify(value));return {...value,streamId};}
 async reserve({blockMs=5000,count=1}={}){const rows=await this.client.xreadgroup('GROUP',this.group,this.consumer,'COUNT',Math.max(1,Math.min(count,50)),'BLOCK',Math.max(0,blockMs),'STREAMS',this.stream,'>');if(!rows?.length)return [];const messages=rows[0]?.[1]||[];return messages.map(([streamId,fields])=>({streamId,...decodeFields(fields)})).filter(x=>x.job).map(x=>({...JSON.parse(x.job),streamId:x.streamId}));}
 async ack(streamId){return Number(await this.client.xack(this.stream,this.group,streamId))>0;}
 async deadLetter(job){const clean={...job};delete clean.streamId;await this.client.xadd(this.deadLetterStream,'MAXLEN','~',this.maxLen,'*','job',JSON.stringify(clean));return{deadLettered:true,job:clean};}
 async fail(job,{retry=true,maxAttempts=5,error}={}){const next={...job,attempt:Number(job.attempt||0)+1,lastError:String(error||'unknown').slice(0,500)};await this.ack(job.streamId);if(!retry||next.attempt>=maxAttempts)return this.deadLetter(next);const queued=await this.enqueue({...next,idempotencyKey:job.idempotencyKey?job.idempotencyKey+':retry:'+next.attempt:null});return {requeued:true,job:queued};}
 async reclaim({minIdleMs=60000,count=50}={}){const result=await this.client.xautoclaim(this.stream,this.group,this.consumer,minIdleMs,'0-0','COUNT',Math.max(1,Math.min(count,100)));const messages=result?.[1]||[];return messages.map(([streamId,fields])=>({streamId,...decodeFields(fields)})).filter(x=>x.job).map(x=>({...JSON.parse(x.job),streamId:x.streamId}));}
 async healthcheck(){try{await this.client.xlen(this.stream);return true;}catch{return false;}}
 async close(){if(typeof this.client.quit==='function')return this.client.quit();}
}

export async function createRedisJobQueue(options={}){const RedisClass=(await import('ioredis')).default;const url=String(options.url||process.env.CODINGVIBES_REDIS_URL||'').trim();if(!url)throw new Error('CODINGVIBES_REDIS_URL is required for Redis queue');const client=new RedisClass(url,{maxRetriesPerRequest:3,enableReadyCheck:true,lazyConnect:false});return new RedisJobQueue(client,options).init();}

export class InMemoryJobQueue{
 constructor(){this.items=[];this.waiters=[];this.closed=false;this.idempotency=new Map();this.deadLetters=[];}
 async enqueue(job){if(this.closed)throw new Error('queue_closed');const value=normalizeJob(job);if(value.idempotencyKey){const existing=this.idempotency.get(value.idempotencyKey);if(existing)return existing;this.idempotency.set(value.idempotencyKey,value);}const waiter=this.waiters.shift();if(waiter)waiter([value]);else this.items.push(value);return value;}
 async reserve(){if(this.closed)throw new Error('queue_closed');if(this.items.length)return [this.items.shift()];return new Promise(resolve=>this.waiters.push(resolve));}
 async ack(){return true;}
 async deadLetter(job){const clean={...job};this.deadLetters.push(clean);return{deadLettered:true,job:clean};}
 async fail(job,{retry=true,maxAttempts=5,error}={}){const next={...job,attempt:Number(job.attempt||0)+1,lastError:String(error||'unknown').slice(0,500)};if(!retry||next.attempt>=maxAttempts)return this.deadLetter(next);return{requeued:true,job:await this.enqueue({...next,idempotencyKey:job.idempotencyKey?job.idempotencyKey+':retry:'+next.attempt:null})};}
 async reclaim(){return [];}
 async healthcheck(){return !this.closed;}
 async close(){this.closed=true;for(const resolve of this.waiters.splice(0))resolve([]);}
}
export async function createJobQueue(options={}){const backend=String(options.backend||process.env.CODINGVIBES_QUEUE_BACKEND||'local').toLowerCase();if(backend==='redis')return createRedisJobQueue(options);if(backend!=='local')throw new Error('unsupported_job_queue_backend');return new InMemoryJobQueue();}
