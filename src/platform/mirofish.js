function config(env=process.env){
  const base=String(env.CODINGVIBES_MIROFISH_URL||'').trim().replace(/\/$/,'');
  const token=String(env.CODINGVIBES_MIROFISH_API_KEY||'').trim();
  const path=String(env.CODINGVIBES_MIROFISH_RUN_PATH||'/simulate').trim();
  return{base,token,path};
}
export function getMiroFishStatus(env=process.env){
  const c=config(env);
  if(!c.base||!c.token)return{status:'NOT_CONFIGURED',available:false,reason:'MiroFish URL and API key are not configured'};
  return{status:'CONFIGURED',available:true,endpoint:c.base+c.path};
}
export async function runMiroFishScenario({scenario,env=process.env,timeoutMs=10000}={}){
  const c=config(env);
  if(!c.base||!c.token)return{status:'NOT_CONFIGURED',available:false,scenarioId:scenario?.id||null};
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),Math.max(1000,Number(timeoutMs)||10000));
  try{
    const response=await fetch(c.base+c.path,{method:'POST',headers:{accept:'application/json','content-type':'application/json',authorization:'Bearer '+c.token},body:JSON.stringify({scenario}),signal:controller.signal});
    const text=await response.text();let data={};try{data=text?JSON.parse(text):{}}catch{data={raw:text.slice(0,2000)}}
    if(!response.ok)return{status:'BLOCKED',available:true,httpStatus:response.status,error:String(data?.error||data?.message||'mirofish_request_failed').slice(0,500),scenarioId:scenario?.id||null};
    return{status:'PASS',available:true,scenarioId:scenario?.id||null,result:data};
  }catch(error){return{status:error?.name==='AbortError'?'BLOCKED':'BLOCKED',available:true,scenarioId:scenario?.id||null,error:error?.name==='AbortError'?'mirofish_timeout':String(error?.message||error).slice(0,500)}}
  finally{clearTimeout(timer)}
}
