import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const MAX_FILE_BYTES=Number(process.env.CODINGVIBES_REMOTE_MAX_FILE_BYTES||2*1024*1024);
const MAX_PAYLOAD_BYTES=Number(process.env.CODINGVIBES_REMOTE_MAX_PAYLOAD_BYTES||45*1024*1024);
const MAX_FILES=Number(process.env.CODINGVIBES_REMOTE_MAX_FILES||3000);
const EXCLUDED=new Set(['.git','node_modules','.codingvibes','data','runs','previews']);
function fileSha(buffer){return crypto.createHash('sha256').update(buffer).digest('hex');}
function collect(workspace){
  const files=[];let total=0;
  const walk=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(EXCLUDED.has(entry.name))continue;const full=path.join(dir,entry.name);const st=fs.lstatSync(full);if(st.isSymbolicLink())continue;if(entry.isDirectory())walk(full);else if(entry.isFile()){if(files.length>=MAX_FILES)throw new Error('remote workspace file limit exceeded');if(st.size>MAX_FILE_BYTES)throw new Error(`remote workspace file exceeds per-file limit: ${entry.name}`);const buffer=fs.readFileSync(full);total+=buffer.length;if(total>MAX_PAYLOAD_BYTES)throw new Error('remote workspace payload too large');files.push({path:path.relative(workspace,full),content:buffer.toString('base64'),sha256:fileSha(buffer)})}}};
  walk(workspace);return {files,totalBytes:total};
}
function digestManifest(files){const h=crypto.createHash('sha256');for(const file of [...files].sort((a,b)=>a.path.localeCompare(b.path)))h.update(file.path).update('\0').update(file.sha256).update('\0');return h.digest('hex');}
export async function remoteMacBuild({workspace,request,target,runnerUrl=process.env.CODINGVIBES_MACOS_RUNNER_URL,token=process.env.CODINGVIBES_MACOS_RUNNER_TOKEN,scheme=process.env.CODINGVIBES_IOS_SCHEME||'CodingVibesApp'}={}){
  if(!runnerUrl)return {available:false,status:'blocked',reason:'CODINGVIBES_MACOS_RUNNER_URL is not configured'};
  if(!token)return {available:false,status:'blocked',reason:'CODINGVIBES_MACOS_RUNNER_TOKEN is required'};
  const url=new URL(runnerUrl);if(process.env.NODE_ENV==='production'&&url.protocol!=='https:')return {available:false,status:'blocked',reason:'production macOS runner requires HTTPS'};
  if(!/^[A-Za-z0-9._ -]{1,100}$/.test(scheme))return {available:false,status:'blocked',reason:'invalid Xcode scheme'};
  const {files,totalBytes}=collect(workspace);const jobId=`cv-${crypto.randomUUID()}`;const workspaceManifest=digestManifest(files);
  const payload={schema:'codingvibes.macos-job.v3',target:target.id,request,jobId,workspaceManifest,totalBytes,files,profile:{type:'ios-simulator-debug',scheme}};
  const headers={'content-type':'application/json','authorization':`Bearer ${token}`,'x-codingvibes-job-id':jobId,'x-codingvibes-workspace-sha256':workspaceManifest};
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),Number(process.env.CODINGVIBES_MACOS_REQUEST_TIMEOUT_MS||35*60_000));
  try{const res=await fetch(url.toString().replace(/\/$/,'')+'/build',{method:'POST',headers,body:JSON.stringify(payload),signal:controller.signal});const body=await res.json().catch(()=>({}));
    const attested=Boolean(res.ok&&body.ok&&body.jobId===jobId&&body.workspaceManifest===workspaceManifest&&body.status==='verified'&&Array.isArray(body.artifacts)&&body.artifacts.length>0&&Array.isArray(body.results)&&body.results.some(x=>x?.tests?.ok));
    return {available:true,status:res.ok?(body.status||'failed'):'failed',statusCode:res.status,jobId:body.jobId||jobId,workspaceManifest,artifactUrls:body.artifactUrls||[],artifacts:(body.artifacts||[]).map((a,i)=>({...a,url:body.uploads?.[i]?.upload?.url||null,upload:body.uploads?.[i]?.upload||null})),uploads:body.uploads||[],results:body.results||[],attested,runnerKind:'macos-remote',raw:body};
  }catch(error){return {available:true,status:'failed',jobId,workspaceManifest,reason:error.name==='AbortError'?'macOS runner request timeout':error.message};}finally{clearTimeout(timer);}
}


export async function remoteLinuxBuild({workspace,request,target,runnerUrl=process.env.CODINGVIBES_LINUX_RUNNER_URL,token=process.env.CODINGVIBES_LINUX_RUNNER_TOKEN}={}){
  if(!runnerUrl)return {available:false,status:'blocked',reason:'CODINGVIBES_LINUX_RUNNER_URL is not configured'};
  if(!token)return {available:false,status:'blocked',reason:'CODINGVIBES_LINUX_RUNNER_TOKEN is required'};
  const url=new URL(runnerUrl);if(process.env.NODE_ENV==='production'&&url.protocol!=='https:')return {available:false,status:'blocked',reason:'production Linux runner requires HTTPS'};
  const files=[];let total=0;const excluded=new Set(['.git','node_modules','.codingvibes','data','runs','previews']);const secret=/^(\.env(?:\..*)?|.*\.(pem|key|p12|pfx|jks|keystore))$/i;
  const walk=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(excluded.has(entry.name))continue;if(secret.test(entry.name)&&entry.name!=='.env.example')continue;const full=path.join(dir,entry.name);const st=fs.lstatSync(full);if(st.isSymbolicLink())continue;if(st.isDirectory())walk(full);else if(st.isFile()){const buffer=fs.readFileSync(full);if(buffer.length>10*1024*1024)throw new Error(`remote Linux file too large: ${entry.name}`);total+=buffer.length;if(total>100*1024*1024)throw new Error('remote Linux workspace too large');files.push({path:path.relative(workspace,full),content:buffer.toString('base64'),sha256:fileSha(buffer)});}}};
  walk(workspace);const workspaceManifest=digestManifest(files);const jobId=`cv-${crypto.randomUUID()}`;const payload={schema:'codingvibes.linux-job.v1',target:target.id,requestHash:crypto.createHash('sha256').update(String(request)).digest('hex'),jobId,workspaceManifest,totalBytes:total,files};
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),Number(process.env.CODINGVIBES_LINUX_REQUEST_TIMEOUT_MS||25*60_000));
  try{const res=await fetch(url.toString().replace(/\/$/,'')+'/build',{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${token}`,'x-codingvibes-job-id':jobId,'x-codingvibes-workspace-sha256':workspaceManifest},body:JSON.stringify(payload),signal:controller.signal});const body=await res.json().catch(()=>({}));const attested=Boolean(res.ok&&body.ok&&body.status==='verified'&&body.jobId===jobId&&body.workspaceManifest===workspaceManifest&&Array.isArray(body.artifacts)&&body.artifacts.length>0);return {available:true,status:res.ok?(body.status||'failed'):'failed',statusCode:res.status,jobId,workspaceManifest,artifacts:(body.artifacts||[]).map((a,i)=>({...a,url:body.uploads?.[i]?.upload?.url||null,upload:body.uploads?.[i]?.upload||null})),artifactUrls:(body.uploads||[]).map(x=>x.upload?.url).filter(Boolean),results:body.results||[],uploads:body.uploads||[],attested,runnerKind:'linux-remote',raw:body};}
  catch(error){return {available:true,status:'failed',jobId,workspaceManifest,reason:error.name==='AbortError'?'Linux runner request timeout':error.message};}
  finally{clearTimeout(timer);}
}
