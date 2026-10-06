function config(env=process.env){
  const base=String(env.CODINGVIBES_MIROFISH_URL||'').trim().replace(/\/$/,'');
  const token=String(env.CODINGVIBES_MIROFISH_API_KEY||'').trim();
  const runPath=String(env.CODINGVIBES_MIROFISH_RUN_PATH||'/simulate').trim();
  const scenarioPath=String(env.CODINGVIBES_MIROFISH_SCENARIO_PATH||'/scenarios').trim();
  return{base,token,runPath,scenarioPath};
}
export function getMiroFishStatus(env=process.env){
  const c=config(env);
  if(!c.base||!c.token)return{status:'NOT_CONFIGURED',available:false,reason:'MiroFish URL and API key are not configured'};
  return{status:'CONFIGURED',available:true,endpoint:c.base+c.runPath};
}
async function request(path,body,{env=process.env,timeoutMs=10000}={}){
  const c=config(env);if(!c.base||!c.token)return{status:'NOT_CONFIGURED',available:false};
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),Math.max(1000,Number(timeoutMs)||10000));
  try{
    const response=await fetch(c.base+path,{method:'POST',headers:{accept:'application/json','content-type':'application/json',authorization:'Bearer '+c.token},body:JSON.stringify(body),signal:controller.signal});
    const raw=await response.text();let data={};try{data=raw?JSON.parse(raw):{}}catch{data={raw:raw.slice(0,2000)}}
    if(!response.ok)return{status:'BLOCKED',available:true,httpStatus:response.status,error:String(data?.error||data?.message||'mirofish_request_failed').slice(0,500)};
    return{status:'PASS',available:true,data};
  }catch(error){return{status:'BLOCKED',available:true,error:error?.name==='AbortError'?'mirofish_timeout':String(error?.message||error).slice(0,500)}}
  finally{clearTimeout(timer)}
}
export async function generateMiroFishScenario({requirements,env=process.env}={}){
  const c=config(env);return request(c.scenarioPath,{requirements},{env});
}
export async function runMiroFishScenario({scenario,env=process.env,timeoutMs=10000}={}){
  const c=config(env);const result=await request(c.runPath,{scenario},{env,timeoutMs});
  return{...result,scenarioId:scenario?.id||null};
}
export function ingestMiroFishResult(result){
  if(!result||typeof result!=='object')return{status:'BLOCKED',error:'invalid_mirofish_result'};
  const score=normalizeMiroFishScore(result.score??result.metrics?.score);
  return{status:'INGESTED',score,rawStatus:String(result.status||'unknown').slice(0,100),providerId:result.id?String(result.id).slice(0,200):null};
}
export function normalizeMiroFishScore(value){
  const n=Number(value);if(!Number.isFinite(n))return null;
  return Number(Math.min(100,Math.max(0,n)).toFixed(2));
}
