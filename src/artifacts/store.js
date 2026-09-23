import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const MAX_UPLOAD_BYTES=Number(process.env.CODINGVIBES_ARTIFACT_MAX_BYTES||500*1024*1024);
function safeName(name){return String(name||'artifact').replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,180)}
export function hashFile(file){const h=crypto.createHash('sha256');h.update(fs.readFileSync(file));return h.digest('hex')}
export function artifactManifest(artifacts=[]){return {schema:'codingvibes.artifact.v2',generatedAt:new Date().toISOString(),artifacts:artifacts.map(({path,size,sha256})=>({path,size,sha256}))};}
export function collectArtifacts(root,patterns=[]){
  const out=[];const walk=(dir)=>{if(!fs.existsSync(dir))return;for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(entry.isFile())out.push(full)}};walk(root);
  const exts=new Set(patterns.length?patterns.map(x=>x.startsWith('.')?x.toLowerCase():`.${x.toLowerCase()}`):['.apk','.aab','.ipa','.app','.exe','.dmg','.deb','.rpm','.msi']);
  return out.filter(f=>exts.has(path.extname(f).toLowerCase())).map(f=>({path:path.relative(root,f),size:fs.statSync(f).size,sha256:hashFile(f)}));
}
export function copyArtifacts(root,artifactRoot,artifacts,runId){const dir=path.join(artifactRoot,safeName(runId));fs.mkdirSync(dir,{recursive:true});return artifacts.map(a=>{const src=path.resolve(root,a.path);const rootAbs=path.resolve(root);if(src!==rootAbs&&!src.startsWith(rootAbs+path.sep))throw new Error('artifact path escapes workspace');if(!fs.existsSync(src)||!fs.statSync(src).isFile())throw new Error(`artifact missing: ${a.path}`);const size=fs.statSync(src).size;if(size>MAX_UPLOAD_BYTES)throw new Error(`artifact exceeds size limit: ${a.path}`);const dest=path.join(dir,safeName(path.basename(a.path)));fs.copyFileSync(src,dest);const sha256=hashFile(dest);return {...a,size,sha256,storedPath:dest}})}
export async function uploadArtifact(file,{url,token,timeoutMs=60_000,maxBytes=MAX_UPLOAD_BYTES}={}){
  if(!file||!fs.existsSync(file))return {uploaded:false,reason:'artifact file missing'};const stat=fs.statSync(file);if(!stat.isFile())return {uploaded:false,reason:'artifact is not a regular file'};if(stat.size>maxBytes)return {uploaded:false,reason:'artifact exceeds upload size limit'};if(!url)return {uploaded:false,reason:'artifact upload URL not configured'};
  const parsed=new URL(url);if(process.env.NODE_ENV==='production'&&parsed.protocol!=='https:')return {uploaded:false,reason:'production artifact uploads require HTTPS'};
  const body=fs.readFileSync(file);const sha=hashFile(file);const headers={'content-type':'application/octet-stream','content-length':String(body.length),'x-artifact-sha256':sha};if(token)headers.authorization=`Bearer ${token}`;
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);try{const res=await fetch(url,{method:'PUT',headers,body,signal:controller.signal});const echoed=res.headers.get('x-artifact-sha256')||res.headers.get('x-uploaded-sha256');if(res.ok&&echoed&&echoed!==sha)return {uploaded:false,status:res.status,reason:'remote checksum mismatch',expectedSha256:sha,remoteSha256:echoed};return {uploaded:res.ok,status:res.status,url:res.url,sha256:sha,acknowledged:Boolean(echoed)};}catch(error){return {uploaded:false,reason:error.name==='AbortError'?'artifact upload timeout':error.message,sha256:sha};}finally{clearTimeout(timer);}
}
