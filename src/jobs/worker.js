export class JobWorker{
 constructor({queue,handlers={},logger=console,concurrency=1,idleDelayMs=250,reclaimEveryMs=30000,signal}={}){
  if(!queue)throw new Error('job_queue_required');this.queue=queue;this.handlers=handlers;this.logger=logger;this.concurrency=Math.max(1,Math.min(Number(concurrency)||1,32));this.idleDelayMs=Math.max(25,Number(idleDelayMs)||250);this.reclaimEveryMs=Math.max(5000,Number(reclaimEveryMs)||30000);this.signal=signal||null;this.stopping=false;this.active=new Set();this.reclaimTimer=null;
 }
 register(type,handler){if(!type||typeof handler!=='function')throw new Error('job_handler_required');this.handlers[String(type)]=handler;return this;}
 async start(){
  if(this.reclaimTimer===null)this.reclaimTimer=setInterval(()=>this.reclaim().catch(error=>this.logger.error?.(error)),this.reclaimEveryMs);
  if(this.signal)this.signal.addEventListener('abort',()=>this.stop(),{once:true});
  while(!this.stopping){
   while(!this.stopping&&this.active.size<this.concurrency){const reserved=await this.queue.reserve({blockMs:Math.min(1000,this.idleDelayMs*4),count:Math.max(1,this.concurrency-this.active.size)});if(!reserved?.length)break;for(const job of reserved)this.run(job);}
   if(this.active.size===0&& !this.stopping)await sleep(this.idleDelayMs);
   else if(!this.stopping)await Promise.race([...this.active]);
  }
  await Promise.allSettled([...this.active]);
 }
 stop(){this.stopping=true;if(this.reclaimTimer){clearInterval(this.reclaimTimer);this.reclaimTimer=null;}}
 async run(job){
  const task=(async()=>{const handler=this.handlers[job.type];if(!handler){await this.queue.fail(job,{retry:false,error:'no_handler:'+job.type});return;}try{await handler(job.payload,job);await this.queue.ack(job.streamId);}catch(error){await this.queue.fail(job,{error:String(error?.message||error)});}})();
  this.active.add(task);try{await task;}finally{this.active.delete(task);}
 }
 async reclaim(){const jobs=await this.queue.reclaim({minIdleMs:this.reclaimEveryMs*2,count:50});for(const job of jobs)if(this.active.size<this.concurrency)this.run(job);}
}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));