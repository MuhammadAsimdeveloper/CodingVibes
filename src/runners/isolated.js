import {spawn} from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import {TARGET_RUNNER_IMAGES,runnerPolicy,RUNNER_RESOURCE_LIMITS} from './dockerfiles.js';
import {dependencyCacheKey,cacheVolumeName,dependencyCachePolicy} from './cache.js';

const IMAGE_BY_TARGET={
  'android-kotlin':TARGET_RUNNER_IMAGES.android,'android-twa':TARGET_RUNNER_IMAGES.android,'mobile-flutter':TARGET_RUNNER_IMAGES.flutter,
  'desktop-tauri':TARGET_RUNNER_IMAGES.rust,'multiplatform-kmp':TARGET_RUNNER_IMAGES.android,
};
const SAFE_DEP_NETWORK=/^codingvibes-deps-[a-z0-9-]{1,48}$/;
const MAX_OUTPUT=120_000;

function dockerAvailable(){return new Promise(resolve=>{const p=spawn('docker',['version','--format','{{.Server.Version}}'],{stdio:['ignore','ignore','ignore']});p.on('error',()=>resolve(false));p.on('close',c=>resolve(c===0));})}
function execDocker(args,{timeoutMs=RUNNER_RESOURCE_LIMITS.timeoutMs}={}){return new Promise(resolve=>{const p=spawn('docker',args,{stdio:['ignore','pipe','pipe']});let stdout='',stderr='';let timedOut=false;p.stdout.on('data',d=>{stdout=(stdout+d).slice(-MAX_OUTPUT)});p.stderr.on('data',d=>{stderr=(stderr+d).slice(-MAX_OUTPUT)});const t=setTimeout(()=>{timedOut=true;p.kill('SIGTERM');setTimeout(()=>p.kill('SIGKILL'),2000).unref()},timeoutMs);p.on('error',e=>{clearTimeout(t);resolve({ok:false,code:127,stdout,stderr:e.message,timedOut})});p.on('close',code=>{clearTimeout(t);resolve({ok:code===0&&!timedOut,code:code??1,stdout,stderr,timedOut})})})}
function pinnedImage(image){return /^.+@sha256:[a-f0-9]{64}$/i.test(String(image||''));}
function imageAllowed(image){return /^ghcr\.io\/codingvibes\/runner-[a-z0-9-]+(?::[a-z0-9._-]+|@sha256:[a-f0-9]{64})$/i.test(String(image||''));}
function validDependencyNetwork(network){return network==='none'||(SAFE_DEP_NETWORK.test(network||''));}

const COPY_MAX_FILES=Number(process.env.CODINGVIBES_NATIVE_STAGE_MAX_FILES||6000);
const COPY_MAX_BYTES=Number(process.env.CODINGVIBES_NATIVE_STAGE_MAX_BYTES||100*1024*1024);
const SECRET_FILE=/^(\.env(?:\..*)?|.*\.(pem|key|p12|pfx|jks|keystore))$/i;
const EXCLUDE_NAMES=new Set(['.git','node_modules','.codingvibes','data','runs','previews']);

export function stageWorkspace(source){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'codingvibes-native-'));let files=0,total=0;
  const copy=(from,to)=>{for(const entry of fs.readdirSync(from,{withFileTypes:true})){if(EXCLUDE_NAMES.has(entry.name))continue;if(SECRET_FILE.test(entry.name)&&entry.name!=='.env.example')continue;const src=path.join(from,entry.name);const rel=path.relative(source,src);const dest=path.join(to,entry.name);const st=fs.lstatSync(src);if(st.isSymbolicLink())continue;if(st.isDirectory()){fs.mkdirSync(dest,{recursive:true,mode:0o700});copy(src,dest);continue;}if(!st.isFile())continue;if(++files>COPY_MAX_FILES||st.size>10*1024*1024||total+st.size>COPY_MAX_BYTES)throw new Error('native workspace staging limits exceeded');fs.mkdirSync(path.dirname(dest),{recursive:true,mode:0o700});fs.copyFileSync(src,dest);fs.chmodSync(dest,0o600);total+=st.size;}};
  try{copy(path.resolve(source),root);fs.writeFileSync(path.join(root,'.codingvibes-stage.json'),JSON.stringify({schema:'codingvibes.native-stage.v1',sourceSha256:crypto.createHash('sha256').update(String(source)).digest('hex'),files,totalBytes:total})+'\n',{mode:0o600});return {root,files,totalBytes:total};}catch(error){fs.rmSync(root,{recursive:true,force:true});throw error;}
}

export async function createIsolatedTargetRunner({workspace,target}={}){
  const mode=process.env.CODINGVIBES_TARGET_RUNNER_MODE||'disabled';
  if(mode==='disabled')return {available:false,mode,reason:'target runner disabled'};
  if(mode==='eas'&&target.id==='mobile-expo')return {available:true,mode,kind:'eas'};
  if(mode!=='docker')return {available:false,mode,reason:`unsupported target runner mode: ${mode}`};
  const image=process.env[`CODINGVIBES_${target.family.toUpperCase()}_RUNNER_IMAGE`]||IMAGE_BY_TARGET[target.id];
  if(!image)return {available:false,mode,reason:`no isolated runner image configured for ${target.id}`};
  if(!imageAllowed(image)&&process.env.CODINGVIBES_ALLOW_CUSTOM_RUNNER_IMAGES!=='true')return {available:false,mode,reason:'runner image is outside the approved registry',image};
  if(process.env.NODE_ENV==='production'&&process.env.CODINGVIBES_REQUIRE_PINNED_IMAGES!=='false'&&!pinnedImage(image))return {available:false,mode,reason:'production requires a digest-pinned runner image',image};
  if(!(await dockerAvailable()))return {available:false,mode,reason:'Docker daemon unavailable',image,policy:runnerPolicy(target)};
  const source=path.resolve(workspace);if(!fs.existsSync(source))return {available:false,mode,reason:'workspace missing',image};
  let staged;try{staged=stageWorkspace(source);}catch(error){return {available:false,mode,reason:error.message,image};}
  const work=staged.root;
  const cachePolicy=dependencyCachePolicy(target.id);const cacheKey=dependencyCacheKey(work,{targetId:target.id,runnerImage:image,toolchainVersion:process.env.CODINGVIBES_TOOLCHAIN_VERSION||'fleet'});const cacheVolume=cachePolicy.enabled?cacheVolumeName({targetId:target.id,key:cacheKey}):null;
  const run=async(command,args=[],runOptions={})=>{
    const network=runOptions.network||'none';if(!validDependencyNetwork(network))return {ok:false,code:78,stdout:'',stderr:'unsafe runner network requested'};
    const dockerArgs=['run','--rm','--init','--network',network,'--cpus',String(RUNNER_RESOURCE_LIMITS.cpu),'--memory',RUNNER_RESOURCE_LIMITS.memory,'--pids-limit',String(RUNNER_RESOURCE_LIMITS.pids),'--ulimit','nofile=8192:8192','--cap-drop','ALL','--security-opt','no-new-privileges','--security-opt','seccomp=default','--read-only','--tmpfs','/tmp:rw,nosuid,nodev,noexec','--tmpfs','/run:rw,nosuid,nodev','-v',`${work}:/workspace:rw`,'-w','/workspace'];
    if(runOptions.cache&&cacheVolume)for(const cachePath of cachePolicy.paths||[])dockerArgs.push('-v',`${cacheVolume}:${cachePath}`);
    dockerArgs.push(image,command,...args);return execDocker(dockerArgs,{timeoutMs:runOptions.timeoutMs||RUNNER_RESOURCE_LIMITS.timeoutMs});
  };
  const dependencyNetwork=process.env.CODINGVIBES_DEPENDENCY_NETWORK||'';
  const runNetwork=async(command,args=[])=>{if(!validDependencyNetwork(dependencyNetwork)||dependencyNetwork==='none')return {ok:false,code:78,stdout:'',stderr:'controlled dependency network is not configured or is unsafe'};return run(command,args,{network:dependencyNetwork,cache:true});};
  return {available:true,mode,kind:'docker',image,workspace:work,sourceWorkspace:source,stagedWorkspace:true,stage:{files:staged.files,totalBytes:staged.totalBytes},policy:runnerPolicy(target),dependencyPolicy:runnerPolicy(target,{phase:'dependencies'}),cache:{enabled:Boolean(cacheVolume),key:cacheKey,volume:cacheVolume,policy:cachePolicy},run,runNetwork,cleanup:()=>{try{fs.rmSync(work,{recursive:true,force:true});return true;}catch{return false;}}};
}
