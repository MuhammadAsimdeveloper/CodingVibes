const SECRET_KEY_RE=/(?:token|secret|password|passwd|api[-_]?key|authorization|cookie|session|credential|private[-_]?key)/i;
const SAFE_EVENT_RE=/^[a-z0-9][a-z0-9._:-]{1,119}$/;
export function sanitizeProductEvent({userId=null,projectId=null,sessionId=null,event,properties={}}={}){
  const name=String(event||'').trim().toLowerCase();
  if(!SAFE_EVENT_RE.test(name))throw new Error('invalid_event_name');
  const input=properties&&typeof properties==='object'&&!Array.isArray(properties)?properties:{};
  const clean={};
  for(const [key,value] of Object.entries(input).slice(0,30)){
    const safeKey=String(key).replace(/[^a-zA-Z0-9_.:-]/g,'_').slice(0,80);
    if(!safeKey||SECRET_KEY_RE.test(safeKey))continue;
    if(value==null||typeof value==='number'||typeof value==='boolean')clean[safeKey]=value;
    else if(typeof value==='string')clean[safeKey]=value.slice(0,500);
    else clean[safeKey]=String(value).slice(0,500);
  }
  return{userId:userId?String(userId):null,projectId:projectId?String(projectId):null,sessionId:sessionId?String(sessionId):null,event:name,properties:clean};
}
export function recordProductEvent(store,event){
  return store.recordProductEvent(event);
}
export function summarizeProductEvents(rows=[]){
  const byEvent={};
  for(const row of rows){byEvent[row.event]=(byEvent[row.event]||0)+1;}
  return{total:rows.length,events:Object.entries(byEvent).sort((a,b)=>b[1]-a[1]).map(([event,count])=>({event,count}))};
}
