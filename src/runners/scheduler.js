import crypto from 'node:crypto';

const DEFAULT_LIMITS={android:2,flutter:1,rust:1,macos:1,androidDevice:1};

function limitFor(capability){
  const key=`CODINGVIBES_RUNNER_CONCURRENCY_${String(capability).replace(/[^a-z0-9]/gi,'_').toUpperCase()}`;
  const raw=process.env[key];
  const value=raw===undefined?DEFAULT_LIMITS[capability]||1:Number(raw);
  return Number.isFinite(value)&&value>0?Math.floor(value):1;
}

export class RunnerLeaseManager {
  constructor({clock=()=>Date.now()}={}){this.clock=clock;this.active=new Map();this.waiters=new Map();}
  snapshot(){
    const out={};
    for(const [cap,state] of this.active)out[cap]={limit:state.limit,active:state.leases.size,queued:(this.waiters.get(cap)||[]).length};
    return out;
  }
  async acquire({capability,runId,target,timeoutMs=30_000}={}){
    if(!capability)throw new Error('runner capability is required');
    const limit=limitFor(capability);const state=this.active.get(capability)||{limit,leases:new Map()};state.limit=limit;this.active.set(capability,state);
    if(state.leases.size<state.limit)return this.#grant(capability,state,{runId,target});
    return new Promise((resolve,reject)=>{
      const request={id:crypto.randomUUID(),runId,target,resolve,reject,expiresAt:this.clock()+timeoutMs};
      const queue=this.waiters.get(capability)||[];queue.push(request);this.waiters.set(capability,queue);
      const timer=setTimeout(()=>{
        const q=this.waiters.get(capability)||[];const index=q.findIndex(x=>x.id===request.id);if(index>=0)q.splice(index,1);request.reject(Object.assign(new Error(`runner lease timeout: ${capability}`),{code:'RUNNER_LEASE_TIMEOUT'}));
      },timeoutMs);request.timer=timer;
    });
  }
  release(lease){
    if(!lease)return false;const state=this.active.get(lease.capability);if(!state||!state.leases.has(lease.id))return false;
    state.leases.delete(lease.id);this.#drain(lease.capability,state);return true;
  }
  #grant(capability,state,{runId,target}){
    const id=crypto.randomUUID();const lease={id,capability,runId:runId||null,target:target||null,acquiredAt:new Date(this.clock()).toISOString(),release:()=>this.release(lease)};
    state.leases.set(id,lease);return Promise.resolve(lease);
  }
  #drain(capability,state){
    const q=this.waiters.get(capability)||[];
    while(q.length&&state.leases.size<state.limit){const request=q.shift();clearTimeout(request.timer);this.#grant(capability,state,{runId:request.runId,target:request.target}).then(request.resolve);}
    if(!q.length)this.waiters.delete(capability);else this.waiters.set(capability,q);
  }
}

export function capabilityForTarget(targetId){
  if(['android-kotlin','android-twa','multiplatform-kmp'].includes(targetId))return 'android';
  if(targetId==='mobile-flutter')return 'flutter';
  if(targetId==='desktop-tauri')return 'rust';
  if(targetId==='ios-swiftui')return 'macos';
  if(targetId==='mobile-expo')return 'android';
  return null;
}

export const runnerLeaseManager=new RunnerLeaseManager();
