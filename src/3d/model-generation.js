const PROVIDERS={
  meshy:{label:'Meshy Image-to-3D',baseUrl:'https://api.meshy.ai/openapi/v1',envKey:'MESHY_API_KEY'},
  tripo:{label:'Tripo H-series Image-to-3D',baseUrl:'https://api.tripo3d.ai/v3',envKey:'TRIPO_API_KEY'}
};
const clean=(v,max=4000)=>String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max);
const uniq=(a)=>[...new Set((Array.isArray(a)?a:[]).map(x=>clean(x,4000)).filter(Boolean))];
export function listModelProviders(env=process.env){
  return Object.entries(PROVIDERS).map(([id,p])=>({id,label:p.label,configured:Boolean(env[p.envKey]),capabilities:id==='meshy'?['single-image','multi-image','glb','obj','fbx','usdz']:['single-image','glb','fbx','obj']}));
}
function meshyPayload({imageUrls,model,targetFormats,prompt,multi}){
  const payload=multi?{image_urls:imageUrls.slice(0,4),ai_model:model,target_formats:targetFormats}:{image_url:imageUrls[0],ai_model:model,target_formats:targetFormats};
  if(prompt)payload.texture_prompt=clean(prompt,800);
  return payload;
}
function tripoPayload({imageUrl,model,prompt}){
  const input={type:'image',url:imageUrl};
  const payload={type:'image_to_model',version:model,input};
  if(prompt)payload.text_prompt=clean(prompt,1000);
  return payload;
}
export function normalizeModelRequest(input={}){
  const provider=clean(input.provider||'meshy',40).toLowerCase();
  if(!PROVIDERS[provider])throw new Error('3d_provider_not_supported');
  const imageUrls=uniq(input.imageUrls).slice(0,4),assetIds=uniq(input.assetIds).slice(0,4);
  if(!imageUrls.length&&!assetIds.length)throw new Error('3d_image_required');
  if(imageUrls.length+assetIds.length>4)throw new Error('3d_max_four_images');
  const formats=uniq(input.targetFormats?.length?input.targetFormats:['glb']).filter(x=>['glb','fbx','obj','usdz','stl','3mf'].includes(x));
  return {provider,imageUrls,assetIds,model:clean(input.model||'latest',80),targetFormats:formats.length?formats:['glb'],prompt:clean(input.prompt,800),name:clean(input.name||'Generated 3D model',180)};
}
export async function create3DTask(input,{env=process.env,fetchImpl=fetch}={}){
  const req=normalizeModelRequest(input); const provider=PROVIDERS[req.provider]; const apiKey=String(env[provider.envKey]||'');
  if(!apiKey)throw new Error(req.provider+'_api_key_not_configured');
  if(req.provider==='meshy'){
    if(!req.imageUrls.length)throw new Error('3d_asset_resolution_required');
    const multi=req.imageUrls.length>1, endpoint=provider.baseUrl+(multi?'/multi-image-to-3d':'/image-to-3d');
    const payload=meshyPayload({imageUrls:req.imageUrls,model:req.model,targetFormats:req.targetFormats,prompt:req.prompt,multi});
    const response=await fetchImpl(endpoint,{method:'POST',headers:{authorization:'Bearer '+apiKey,'content-type':'application/json'},body:JSON.stringify(payload)});
    const body=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error('3d_provider_failed:'+response.status+':'+clean(body?.message||body?.error||'request_failed',300));
    return {provider:req.provider,taskId:String(body.result||body.id||''),status:'queued',raw:{id:body.result||body.id||null}};
  }
  if(!req.imageUrls.length)throw new Error('3d_asset_resolution_required');
  const response=await fetchImpl(provider.baseUrl+'/generation/image-to-model',{method:'POST',headers:{authorization:'Bearer '+apiKey,'content-type':'application/json'},body:JSON.stringify(tripoPayload({imageUrl:req.imageUrls[0],model:req.model,prompt:req.prompt}))});
  const body=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error('3d_provider_failed:'+response.status+':'+clean(body?.message||body?.error||'request_failed',300));
  return {provider:req.provider,taskId:String(body.task_id||body.id||''),status:'queued',raw:body};
}
export async function get3DTask({provider,taskId},{env=process.env,fetchImpl=fetch}={}){
  const id=clean(taskId,200),key=clean(provider,40).toLowerCase(),p=PROVIDERS[key];
  if(!p||!id)throw new Error('3d_task_invalid');
  const apiKey=String(env[p.envKey]||'');if(!apiKey)throw new Error(key+'_api_key_not_configured');
  const endpoint=key==='meshy'?p.baseUrl+'/image-to-3d/'+encodeURIComponent(id):p.baseUrl+'/task/'+encodeURIComponent(id);
  const response=await fetchImpl(endpoint,{headers:{authorization:'Bearer '+apiKey}});
  const body=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error('3d_task_query_failed:'+response.status);
  const status=String(body.status||body.task_status||'running').toLowerCase();
  const succeeded=['succeeded','success','completed','done'].includes(status);
  const failed=['failed','error','cancelled','canceled'].includes(status);
  return {provider:key,taskId:id,status:succeeded?'succeeded':failed?'failed':'running',progress:Number(body.progress||0),modelUrls:body.model_urls||body.output||{},thumbnailUrl:body.thumbnail_url||null,error:clean(body.task_error?.message||body.error||'',1000),raw:body};
}
export async function downloadGeneratedModel(url,{fetchImpl=fetch,maxBytes=Number(process.env.CODINGVIBES_MAX_MODEL_BYTES||300*1024*1024)}={}){
  const response=await fetchImpl(String(url));if(!response.ok)throw new Error('3d_download_failed:'+response.status);
  const length=Number(response.headers.get('content-length')||0);if(length>maxBytes)throw new Error('3d_model_too_large');
  const data=Buffer.from(await response.arrayBuffer());if(data.byteLength>maxBytes)throw new Error('3d_model_too_large');
  return data;
}