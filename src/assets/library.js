import crypto from 'node:crypto';

export const ASSET_LIBRARY_VERSION='1.0';
export const MAX_ASSET_BYTES=Number(process.env.CODINGVIBES_MAX_ASSET_BYTES||100*1024*1024);

const EXTENSIONS={png:'image',jpg:'image',jpeg:'image',webp:'image',gif:'image',avif:'image',svg:'image',mp4:'video',webm:'video',mov:'video',glb:'model',gltf:'model',obj:'model',fbx:'model',mp3:'audio',wav:'audio',ogg:'audio',woff:'font',woff2:'font',ttf:'font',otf:'font'};
const ROLES=new Set(['site-image','site-video','product-image','product-model','product-video','scene-model','scene-poster','scene-video','property-image','property-model','property-video','font','texture','document','other']);

export function safeAssetName(name='asset'){
  const raw=String(name||'asset').normalize('NFKC').replace(/[\/\\\\]/g,'_').replace(/[^a-zA-Z0-9._-]/g,'_').replace(/_+/g,'_').replace(/^\.+/,'').slice(0,160);
  return raw||'asset';
}
export function assetType({name='',mime=''}={}){
  const m=String(mime||'').toLowerCase().split(';')[0].trim();
  if(m.startsWith('image/'))return'image';
  if(m.startsWith('video/'))return'video';
  if(m.startsWith('audio/'))return'audio';
  if(m.startsWith('font/'))return'font';
  const ext=String(name).split('.').pop()?.toLowerCase()||'';
  return EXTENSIONS[ext]||'binary';
}
export function assetRoleAllowed(role='site-image'){return ROLES.has(String(role))}
export function hashBuffer(buffer){return crypto.createHash('sha256').update(buffer).digest('hex')}
export function makeAssetRecord({id,name,mime,size,sha256,role='site-image',publicPath='',metadata={}}={}){
  return {id:String(id),version:ASSET_LIBRARY_VERSION,name:safeAssetName(name),mime:String(mime||'application/octet-stream').split(';')[0],kind:assetType({name,mime}),size:Number(size||0),sha256:String(sha256||''),role:assetRoleAllowed(role)?String(role):'other',publicPath:String(publicPath||''),metadata:metadata&&typeof metadata==='object'&&!Array.isArray(metadata)?metadata:{},createdAt:new Date().toISOString()};
}
export function validateAssetUpload({name,mime,size}={}){
  if(!name)return{ok:false,error:'asset_name_required'};
  if(!Number.isFinite(Number(size))||Number(size)<=0)return{ok:false,error:'asset_size_required'};
  if(Number(size)>MAX_ASSET_BYTES)return{ok:false,error:'asset_too_large'};
  const kind=assetType({name,mime});
  if(kind==='binary'&&!/\.(glb|gltf)$/i.test(String(name)))return{ok:false,error:'unsupported_asset_type'};
  return{ok:true,kind};
}
