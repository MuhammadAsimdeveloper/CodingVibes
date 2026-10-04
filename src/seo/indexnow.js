const ENDPOINT='https://api.indexnow.org/indexnow';

function validHttpUrl(value){try{const u=new URL(String(value));return /^https?:$/.test(u.protocol)?u:null}catch{return null}}

export async function submitIndexNow({url,urls,key,endpoint=ENDPOINT,keyLocation,timeoutMs=5000}={}){
  const items=[...(Array.isArray(urls)?urls:[]),url].filter(Boolean).map(String);
  const unique=[...new Set(items)];
  if(!unique.length)throw new Error('indexnow_urls_required');
  const token=String(key||process.env.CODINGVIBES_INDEXNOW_KEY||'').trim();
  if(!token) return {ok:false,skipped:true,reason:'indexnow_key_not_configured'};
  const hosts=new Set(unique.map(validHttpUrl).filter(Boolean).map(u=>u.host));
  if(hosts.size!==1)throw new Error('indexnow_urls_must_share_one_host');
  const payload=unique.length===1
    ?{host:[...hosts][0],key:token,url:unique[0],...(keyLocation?{keyLocation}: {})}
    :{host:[...hosts][0],key:token,urlList:unique,...(keyLocation?{keyLocation}: {})};
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),Math.max(1000,Number(timeoutMs)||5000));let response;try{response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json; charset=utf-8'},body:JSON.stringify(payload),signal:controller.signal});}catch(e){throw new Error(e.name==='AbortError'?'indexnow_timeout':'indexnow_request_failed')}finally{clearTimeout(timer)}
  const body=await response.text();
  if(!response.ok)throw new Error('indexnow_http_'+response.status);
  return {ok:true,submitted:unique.length,status:response.status,body:body.slice(0,500)};
}
