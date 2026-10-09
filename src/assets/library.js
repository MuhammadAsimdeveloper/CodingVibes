import crypto from 'node:crypto';

export const ASSET_LIBRARY_VERSION='1.1';
const configuredMax=Number(process.env.CODINGVIBES_MAX_ASSET_BYTES||100*1024*1024);
export const MAX_ASSET_BYTES=Number.isFinite(configuredMax)&&configuredMax>0?Math.min(Math.floor(configuredMax),500*1024*1024):100*1024*1024;
export const MAX_ASSET_METADATA_BYTES=8192;
export const MAX_SVG_ASSET_BYTES=2*1024*1024;

const EXTENSIONS=Object.freeze({
  png:'image',jpg:'image',jpeg:'image',webp:'image',gif:'image',avif:'image',svg:'image',
  mp4:'video',webm:'video',mov:'video',
  glb:'model',gltf:'model',obj:'model',fbx:'model',
  mp3:'audio',wav:'audio',ogg:'audio',
  woff:'font',woff2:'font',ttf:'font',otf:'font'
});
const MIME_BY_EXTENSION=Object.freeze({
  png:['image/png','application/octet-stream'],
  jpg:['image/jpeg','application/octet-stream'],
  jpeg:['image/jpeg','application/octet-stream'],
  webp:['image/webp','application/octet-stream'],
  gif:['image/gif','application/octet-stream'],
  avif:['image/avif','application/octet-stream'],
  svg:['image/svg+xml'],
  mp4:['video/mp4','application/octet-stream'],
  webm:['video/webm','application/octet-stream'],
  mov:['video/quicktime','application/octet-stream'],
  glb:['model/gltf-binary','application/octet-stream'],
  gltf:['model/gltf+json','application/json','text/plain','application/octet-stream'],
  obj:['model/obj','text/plain','application/octet-stream'],
  fbx:['application/octet-stream','model/vnd.autodesk.fbx','application/vnd.autodesk.fbx'],
  mp3:['audio/mpeg','audio/mp3','application/octet-stream'],
  wav:['audio/wav','audio/x-wav','audio/wave','application/octet-stream'],
  ogg:['audio/ogg','application/ogg','application/octet-stream'],
  woff:['font/woff','application/font-woff','application/octet-stream'],
  woff2:['font/woff2','application/font-woff2','application/octet-stream'],
  ttf:['font/ttf','application/x-font-ttf','application/octet-stream'],
  otf:['font/otf','application/vnd.ms-opentype','application/octet-stream']
});
const ROLES=new Set(['site-image','site-video','product-image','product-model','product-video','scene-model','scene-poster','scene-video','property-image','property-model','property-video','font','texture','document','other']);
const ROLE_KIND=Object.freeze({
  'site-image':'image','product-image':'image','scene-poster':'image','property-image':'image','texture':'image',
  'site-video':'video','product-video':'video','scene-video':'video','property-video':'video',
  'product-model':'model','scene-model':'model','property-model':'model','font':'font'
});

function extensionOf(name){return String(name||'').normalize('NFKC').split(/[\\/]/).pop()?.split('.').pop()?.toLowerCase()||''}
function normalizeMime(mime){return String(mime||'application/octet-stream').split(';')[0].trim().toLowerCase()}
function starts(buffer,signature,offset=0){return Buffer.isBuffer(buffer)&&buffer.length>=offset+signature.length&&buffer.subarray(offset,offset+signature.length).equals(Buffer.from(signature))}
function startsText(buffer,signature){return Buffer.isBuffer(buffer)&&buffer.subarray(0,signature.length).toString('ascii')===signature}

export function safeAssetName(name='asset'){
  const raw=String(name||'asset').normalize('NFKC').replace(/[\/\\\\]/g,'_').replace(/[^a-zA-Z0-9._-]/g,'_').replace(/_+/g,'_').replace(/^[._]+/,'').slice(0,160);
  return raw||'asset';
}
export function assetType({name='',mime=''}={}){
  const ext=extensionOf(name);
  if(EXTENSIONS[ext])return EXTENSIONS[ext];
  const m=normalizeMime(mime);
  if(m.startsWith('image/'))return'image';
  if(m.startsWith('video/'))return'video';
  if(m.startsWith('audio/'))return'audio';
  if(m.startsWith('font/'))return'font';
  return'binary';
}
export function assetRoleAllowed(role='other'){return ROLES.has(String(role))}
export function normalizeAssetMetadata(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input))return {ok:false,error:'asset_metadata_must_be_object'};
  let raw;
  try{raw=JSON.stringify(input)}catch{return {ok:false,error:'asset_metadata_invalid'}}
  if(Buffer.byteLength(raw||'{}','utf8')>MAX_ASSET_METADATA_BYTES)return {ok:false,error:'asset_metadata_too_large'};
  const metadata={};
  for(const [key,value] of Object.entries(input).slice(0,32)){
    if(!/^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/.test(key)||key==='storage')return {ok:false,error:'asset_metadata_invalid_key'};
    if(typeof value==='string')metadata[key]=value.replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,500);
    else if(typeof value==='number'&&Number.isFinite(value))metadata[key]=value;
    else if(typeof value==='boolean'||value===null)metadata[key]=value;
    else return {ok:false,error:'asset_metadata_values_must_be_scalars'};
  }
  return {ok:true,value:metadata};
}
export function validateAssetUpload({name,mime,size,role='other'}={}){
  const rawName=String(name||'').trim();
  if(!rawName||rawName.length>512)return {ok:false,error:'asset_name_required'};
  if(/[\u0000-\u001f\u007f]/.test(rawName))return {ok:false,error:'asset_name_invalid'};
  if(!Number.isSafeInteger(Number(size))||Number(size)<=0)return {ok:false,error:'asset_size_required'};
  if(Number(size)>MAX_ASSET_BYTES)return {ok:false,error:'asset_too_large'};
  const ext=extensionOf(rawName),kind=EXTENSIONS[ext];
  if(!kind)return {ok:false,error:'unsupported_asset_type'};
  const suppliedMime=normalizeMime(mime);
  if(!MIME_BY_EXTENSION[ext]?.includes(suppliedMime))return {ok:false,error:'asset_mime_mismatch'};
  if(!assetRoleAllowed(role))return {ok:false,error:'asset_role_invalid'};
  const requiredKind=ROLE_KIND[role];
  if(requiredKind&&kind!==requiredKind)return {ok:false,error:'asset_role_type_mismatch'};
  if(ext==='svg'&&Number(size)>MAX_SVG_ASSET_BYTES)return {ok:false,error:'svg_asset_too_large'};
  return {ok:true,kind,extension:ext,mime:suppliedMime};
}

/**
 * Header checks are deliberately format-aware. Extension/MIME declarations alone
 * are untrusted; these checks prevent obvious polyglots and renamed executables.
 */
export function validateAssetContent({name,mime,body}={}){
  if(!Buffer.isBuffer(body)||body.length===0)return {ok:false,error:'asset_content_empty'};
  const gate=validateAssetUpload({name,mime,size:body.length,role:'other'});
  if(!gate.ok)return gate;
  const ext=gate.extension;
  let valid=false;
  if(ext==='png')valid=starts(body,[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])&&body.length>=33&&body.readUInt32BE(8)===13&&startsText(body.subarray(12,16),'IHDR');
  else if(ext==='jpg'||ext==='jpeg')valid=starts(body,[0xff,0xd8,0xff]);
  else if(ext==='gif')valid=startsText(body,'GIF87a')||startsText(body,'GIF89a');
  else if(ext==='webp')valid=startsText(body,'RIFF')&&startsText(body.subarray(8),'WEBP');
  else if(ext==='avif')valid=startsText(body.subarray(4),'ftyp')&&/^(avif|avis|mif1|msf1)$/.test(body.subarray(8,12).toString('ascii'));
  else if(ext==='mp4'||ext==='mov')valid=body.length>=12&&startsText(body.subarray(4),'ftyp');
  else if(ext==='webm')valid=starts(body,[0x1a,0x45,0xdf,0xa3]);
  else if(ext==='mp3')valid=startsText(body,'ID3')||(body.length>1&&body[0]===0xff&&(body[1]&0xe0)===0xe0);
  else if(ext==='wav')valid=startsText(body,'RIFF')&&startsText(body.subarray(8),'WAVE');
  else if(ext==='ogg')valid=startsText(body,'OggS');
  else if(ext==='woff')valid=startsText(body,'wOFF');
  else if(ext==='woff2')valid=startsText(body,'wOF2');
  else if(ext==='ttf')valid=starts(body,[0,1,0,0]);
  else if(ext==='otf')valid=startsText(body,'OTTO');
  else if(ext==='glb')valid=startsText(body,'glTF')&&body.length>=20&&body.readUInt32LE(4)===2&&body.readUInt32LE(8)===body.length;
  else if(ext==='gltf'){
    try{
      const parsed=JSON.parse(body.toString('utf8'));
      valid=Boolean(parsed&&typeof parsed==='object'&&parsed.asset&&/^2(?:\.\d+)?$/.test(String(parsed.asset.version||'')));
      const refs=[...(Array.isArray(parsed.buffers)?parsed.buffers:[]),...(Array.isArray(parsed.images)?parsed.images:[])].map(item=>item?.uri).filter(uri=>typeof uri==='string'&&!uri.startsWith('data:'));
      valid=valid&&refs.every(uri=>/^data:[^,]{1,120};base64,/.test(uri));
    }catch{valid=false}
  }
  else if(ext==='obj'){
    const text=body.subarray(0,1024*1024).toString('utf8');
    valid=/^(?:\uFEFF?\s)*(?:#.*\n\s*)*(?:v\s+-?\d|o\s+\S|mtllib\s+\S|g\s+\S)/m.test(text);
  }
  else if(ext==='fbx'){
    valid=startsText(body,'Kaydara FBX Binary')||/FBXHeaderExtension/.test(body.subarray(0,4096).toString('utf8'));
  }
  else if(ext==='svg'){
    const text=body.toString('utf8');
    const hasSvg=/^\s*(?:<\?xml[^>]*>\s*)?<svg\b/i.test(text);
    const dangerous=/<\s*(?:script|foreignObject|iframe|object|embed)\b|<!DOCTYPE|<!ENTITY|\bon[a-z]{3,}\s*=|javascript\s*:|data\s*:\s*text\/html|@import|url\(\s*["']?(?!#)|(?:href|src)\s*=\s*["']\s*(?:https?:|\/\/|file:|blob:|data:)/i.test(text);
    valid=body.length<=MAX_SVG_ASSET_BYTES&&hasSvg&&!dangerous;
  }
  if(!valid)return {ok:false,error:ext==='svg'?'unsafe_or_invalid_svg':'asset_content_mismatch'};
  return {ok:true,kind:gate.kind,extension:ext,mime:gate.mime,size:body.length};
}
export function hashBuffer(buffer){return crypto.createHash('sha256').update(buffer).digest('hex')}
export function makeAssetRecord({id,name,mime,size,sha256,role='site-image',publicPath='',metadata={}}={}){
  return {id:String(id),version:ASSET_LIBRARY_VERSION,name:safeAssetName(name),mime:normalizeMime(mime),kind:assetType({name,mime}),size:Number(size||0),sha256:String(sha256||''),role:assetRoleAllowed(role)?String(role):'other',publicPath:String(publicPath||''),metadata:metadata&&typeof metadata==='object'&&!Array.isArray(metadata)?metadata:{},createdAt:new Date().toISOString()};
}
