import crypto from 'node:crypto';

export const DEFAULT_AGENT_POLICY={
  maxConcurrent:Math.min(6,Math.max(1,Number(process.env.CODINGVIBES_AGENT_MAX_CONCURRENCY||3))),
  timeoutMs:Math.min(60000,Math.max(1000,Number(process.env.CODINGVIBES_AGENT_TIMEOUT_MS||15000))),
  retries:Math.min(2,Math.max(0,Number(process.env.CODINGVIBES_AGENT_RETRIES||1))),
  maxCalls:Math.min(50,Math.max(1,Number(process.env.CODINGVIBES_AGENT_MAX_CALLS||12))),
  maxCostUsd:Math.max(0.01,Number(process.env.CODINGVIBES_AGENT_MAX_COST_USD||1))
};

export class AgentExecutionBudget{
  constructor(options={}){
    const merged={...DEFAULT_AGENT_POLICY,...options};
    this.maxConcurrent=Number(merged.maxConcurrent);
    this.maxCalls=Number(merged.maxCalls);
    this.maxCostUsd=Number(merged.maxCostUsd);
    this.active=0;this.calls=0;this.costUsd=0;
  }
  reserve({role='agent',estimatedCostUsd=0}={}){
    const estimate=Math.max(0,Number(estimatedCostUsd)||0);
    if(this.active>=this.maxConcurrent||this.calls>=this.maxCalls||this.costUsd+estimate>this.maxCostUsd){
      throw Object.assign(new Error('agent_budget_exceeded'),{code:'AGENT_BUDGET_EXCEEDED',role});
    }
    this.active++;this.calls++;return this.snapshot();
  }
  release(){this.active=Math.max(0,this.active-1);return this.snapshot();}
  record({costUsd=0}={}){this.costUsd+=Math.max(0,Number(costUsd)||0);return this.snapshot();}
  snapshot(){return{active:this.active,calls:this.calls,costUsd:Number(this.costUsd.toFixed(6)),maxConcurrent:this.maxConcurrent,maxCalls:this.maxCalls,maxCostUsd:this.maxCostUsd};}
}

export async function withAgentTimeout(task,{timeoutMs=DEFAULT_AGENT_POLICY.timeoutMs,signal}={}){
  if(signal?.aborted)throw Object.assign(new Error('agent_cancelled'),{code:'AGENT_CANCELLED'});
  const controller=new AbortController();
  let timer=null;
  const abort=()=>controller.abort();
  if(signal)signal.addEventListener('abort',abort,{once:true});
  const work=Promise.resolve().then(()=>task(controller.signal));
  const timeoutPromise=new Promise((_,reject)=>{
    timer=setTimeout(()=>{controller.abort();reject(Object.assign(new Error('agent_timeout'),{code:'AGENT_TIMEOUT'}));},Math.max(1,Number(timeoutMs)||DEFAULT_AGENT_POLICY.timeoutMs));
  });
  try{return await Promise.race([work,timeoutPromise]);}
  catch(error){
    if(signal?.aborted)throw Object.assign(new Error('agent_cancelled'),{code:'AGENT_CANCELLED'});
    throw error;
  }finally{
    clearTimeout(timer);
    if(signal)signal.removeEventListener('abort',abort);
  }
}

export async function runBoundedAgents(tasks,{budget=new AgentExecutionBudget(),concurrency=budget.maxConcurrent,timeoutMs=DEFAULT_AGENT_POLICY.timeoutMs,retries=DEFAULT_AGENT_POLICY.retries,retryDelayMs=50,signal,onEvent=()=>{}}={}){
  const list=Array.isArray(tasks)?tasks:[],results=new Array(list.length);
  let cursor=0;
  const workerCount=Math.min(Math.max(1,Number(concurrency)||1),Math.max(1,budget.maxConcurrent),list.length||1);
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,Math.max(0,Number(ms)||0)));
  const worker=async()=>{
    while(true){
      const index=cursor++;if(index>=list.length)return;
      const task=list[index]||{};const attemptsLimit=Math.max(0,Number(task.retries??retries)||0);
      let attempt=0,lastError=null;
      while(attempt<=attemptsLimit){
        if(signal?.aborted){results[index]={id:task.id,role:task.role||'agent',status:'cancelled',attempts:attempt,error:'agent_cancelled'};return;}
        try{budget.reserve({role:task.role,estimatedCostUsd:task.estimatedCostUsd||0});}
        catch(error){results[index]={id:task.id,role:task.role||'agent',status:'blocked',attempts:attempt,error:error.code||error.message};onEvent({type:'agent_blocked',id:task.id,role:task.role,error:error.code||error.message,budget:budget.snapshot()});break;}
        attempt++;onEvent({type:'agent_started',id:task.id,role:task.role,attempt,budget:budget.snapshot()});
        try{
          const value=await withAgentTimeout(task.run,{timeoutMs:task.timeoutMs??timeoutMs,signal});
          const cost=typeof task.estimatedCostUsd==='function'?Number(await task.estimatedCostUsd(value))||0:Number(task.costUsd||task.estimatedCostUsd||0);
          budget.record({costUsd:cost});
          results[index]={id:task.id,role:task.role||'agent',status:'succeeded',attempts:attempt,value,costUsd:cost};
          onEvent({type:'agent_succeeded',id:task.id,role:task.role,attempt,budget:budget.snapshot()});budget.release();break;
        }catch(error){
          lastError=error;budget.release();
          const cancelled=signal?.aborted||error?.code==='AGENT_CANCELLED',retryable=!cancelled&&attempt<=attemptsLimit;
          onEvent({type:retryable?'agent_retry':'agent_failed',id:task.id,role:task.role,attempt,error:error.code||error.message});
          if(!retryable){results[index]={id:task.id,role:task.role||'agent',status:cancelled?'cancelled':'failed',attempts:attempt,error:error.code||String(error.message||error)};break;}
          await pause(retryDelayMs*Math.max(0,attempt-1));
        }
      }
      if(!results[index])results[index]={id:task.id,role:task.role||'agent',status:'failed',attempts:attempt,error:lastError?.message||'agent_failed'};
    }
  };
  await Promise.all(Array.from({length:workerCount},()=>worker()));
  return results;
}

export function makeAgentHandoff({runId,from,to,summary,evidence=[],artifacts=[],constraints=[]}={}){
  const normalizedEvidence=(Array.isArray(evidence)?evidence:[]).map((x,i)=>({
    index:i,
    sourceUrl:(()=>{try{const u=new URL(String(x?.url||''));return u.protocol==='http:'||u.protocol==='https:'?u.toString().slice(0,1000):null;}catch{return null;}})(),
    excerpt:String(x?.text||x?.content||x?.summary||'').replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,1200)
  }));
  const normalized={runId:String(runId||''),from:String(from||'agent'),to:String(to||'agent'),summary:String(summary||'').slice(0,4000),evidence:normalizedEvidence,artifacts:Array.isArray(artifacts)?artifacts.slice(0,20):[],constraints:Array.isArray(constraints)?constraints.slice(0,20):[]};
  const provenanceHash=crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
  return {...normalized,provenanceHash,trustBoundary:'external-evidence-untrusted',instructionPolicy:'evidence_only',createdAt:new Date().toISOString()};
}
