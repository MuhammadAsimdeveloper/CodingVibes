import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn,spawnSync} from 'node:child_process';

const PORT=Number(process.env.PORT||8787);
const TOKEN=process.env.CODINGVIBES_MACOS_RUNNER_TOKEN||'';
if(!TOKEN)throw new Error('CODINGVIBES_MACOS_RUNNER_TOKEN is required');
const ROOT=process.env.CODINGVIBES_MACOS_WORK_ROOT||path.join(os.tmpdir(),'codingvibes-macos-runs');
fs.mkdirSync(ROOT,{recursive:true,mode:0o700});
const MAX=Number(process.env.CODINGVIBES_MACOS_MAX_BYTES||50*1024*1024);
const MAX_FILES=Number(process.env.CODINGVIBES_MACOS_MAX_FILES||3000);
const MAX_CONCURRENCY=Number(process.env.CODINGVIBES_MACOS_MAX_CONCURRENCY||1);
const BUILD_TIMEOUT=Number(process.env.CODINGVIBES_MACOS_BUILD_TIMEOUT_MS||30*60_000);
const UPLOAD_TIMEOUT=Number(process.env.CODINGVIBES_ARTIFACT_UPLOAD_TIMEOUT_MS||60_000);
const ARTIFACT_MAX=Number(process.env.CODINGVIBES_ARTIFACT_MAX_BYTES||500*1024*1024);
const ARTIFACT_URL=process.env.CODINGVIBES_ARTIFACT_UPLOAD_URL||'';
const ARTIFACT_TOKEN=process.env.CODINGVIBES_ARTIFACT_UPLOAD_TOKEN||'';
const DEVELOPER_DIR=process.env.DEVELOPER_DIR||'/Applications/Xcode.app/Contents/Developer';
let active=0;

function json(res,status,payload){res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(payload));}
function read(req){return new Promise((resolve,reject)=>{let n=0,chunks=[];req.on('data',d=>{n+=d.length;if(n>MAX){req.destroy();reject(new Error('payload too large'));return}chunks.push(d)});req.on('end',()=>{try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))}catch(e){reject(e)}});req.on('error',reject)})}
function safe(rel){const p=path.posix.normalize(String(rel||''));return p&&!p.startsWith('../')&&!p.includes('/../')&&!path.isAbsolute(p)&&p!=='.'&&!p.includes('\0')?p:null;}
function validScheme(value){return /^[A-Za-z0-9._ -]{1,100}$/.test(String(value||''));}
function manifestDigest(files){const h=crypto.createHash('sha256');for(const file of [...files].sort((a,b)=>a.path.localeCompare(b.path)))h.update(file.path).update('\0').update(file.sha256).update('\0');return h.digest('hex');}
function writeFiles(work,files){if(!Array.isArray(files)||files.length>MAX_FILES)throw new Error('invalid file set');for(const item of files){const rel=safe(item.path);if(!rel||typeof item.content!=='string'||!/^[a-f0-9]{64}$/i.test(String(item.sha256||'')))throw new Error('invalid file manifest entry');const buffer=Buffer.from(item.content,'base64');if(buffer.length>2*1024*1024)throw new Error('file exceeds limit');const actual=crypto.createHash('sha256').update(buffer).digest('hex');if(actual!==item.sha256)throw new Error(`file checksum mismatch: ${rel}`);const dest=path.join(work,rel);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,buffer,{mode:0o600});}}
function safeEnv(work){return {CI:'1',PATH:process.env.PATH||'/usr/bin:/bin',HOME:work,TMPDIR:path.join(work,'.tmp'),DEVELOPER_DIR};}
function run(cmd,args,cwd,timeout=BUILD_TIMEOUT){return new Promise(resolve=>{const p=spawn(cmd,args,{cwd,env:safeEnv(cwd),stdio:['ignore','pipe','pipe'],shell:false});let stdout='',stderr='',timedOut=false;p.stdout.on('data',d=>{stdout=(stdout+d).slice(-120000)});p.stderr.on('data',d=>{stderr=(stderr+d).slice(-120000)});const t=setTimeout(()=>{timedOut=true;p.kill('SIGTERM');setTimeout(()=>p.kill('SIGKILL'),3000).unref()},timeout);p.on('close',(code,signal)=>{clearTimeout(t);resolve({ok:code===0&&!timedOut,code,signal,timedOut,stdout,stderr})});p.on('error',e=>{clearTimeout(t);resolve({ok:false,code:127,signal:null,timedOut:false,stdout,stderr:e.message})})})}
function findXcodeProject(work){return fs.readdirSync(work,{withFileTypes:true}).filter(x=>x.isDirectory()&&(x.name.endsWith('.xcworkspace')||x.name.endsWith('.xcodeproj'))).map(x=>x.name).sort()[0]||null;}
function collectArtifacts(work){const out=[];const roots=[path.join(work,'DerivedData','Build','Products'),path.join(work,'build'),work];const seen=new Set();const walk=dir=>{if(!fs.existsSync(dir))return;for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(entry.name==='DerivedData'&&dir===work)walk(path.join(dir,entry.name));const full=path.join(dir,entry.name);if(entry.isSymbolicLink())continue;if(entry.isDirectory()){if(entry.name.endsWith('.app')){const archive=path.join(os.tmpdir(),`${crypto.randomUUID()}.app.zip`);const zip=spawnSyncZip(full,archive);if(zip)register(archive,'.app.zip')}else walk(full)}else if(entry.isFile()&&/\.(ipa|xcarchive)$/.test(entry.name))register(full,path.extname(entry.name))}};
  const register=(file,ext)=>{if(seen.has(file)||!fs.existsSync(file))return;const st=fs.statSync(file);if(st.size>ARTIFACT_MAX)return;const sha=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');out.push({path:file,size:st.size,sha256:sha,extension:ext});seen.add(file)};
  for(const root of roots)walk(root);return out;
}
function spawnSyncZip(source,dest){try{const r=spawnSync('/usr/bin/ditto',['-c','-k','--sequesterRsrc','--keepParent',source,dest],{stdio:'ignore'});return r.status===0&&fs.existsSync(dest);}catch{return false;}}
async function uploadArtifact(file){if(!ARTIFACT_URL)return {uploaded:false,reason:'artifact upload URL not configured'};const url=new URL(ARTIFACT_URL);if(url.protocol!=='https:'&&process.env.NODE_ENV==='production')return {uploaded:false,reason:'artifact upload requires HTTPS'};const body=fs.readFileSync(file);if(body.length>ARTIFACT_MAX)return {uploaded:false,reason:'artifact exceeds limit'};const sha=crypto.createHash('sha256').update(body).digest('hex');const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),UPLOAD_TIMEOUT);try{const headers={'content-type':'application/octet-stream','content-length':String(body.length),'x-artifact-sha256':sha};if(ARTIFACT_TOKEN)headers.authorization=`Bearer ${ARTIFACT_TOKEN}`;const res=await fetch(url,{method:'PUT',headers,body,signal:controller.signal});const echoed=res.headers.get('x-artifact-sha256')||res.headers.get('x-uploaded-sha256');if(res.ok&&echoed&&echoed!==sha)return {uploaded:false,status:res.status,reason:'artifact checksum mismatch',sha256:sha};return {uploaded:res.ok,status:res.status,url:res.url,sha256:sha,acknowledged:Boolean(echoed)};}catch(e){return {uploaded:false,reason:e.name==='AbortError'?'artifact upload timeout':e.message,sha256:sha};}finally{clearTimeout(timer);}}
function simulatorDestination(){try{const raw=spawnSync('xcrun',['simctl','list','devices','available','-j'],{encoding:'utf8'});if(raw.status===0){const data=JSON.parse(raw.stdout);for(const devices of Object.values(data.devices||{})){const d=(devices||[]).find(x=>x.isAvailable&&/iPhone/.test(x.name));if(d)return `id=${d.udid}`;}}}catch{}return null;}
async function buildIos(work,profile){const project=findXcodeProject(work);if(project){const flag=project.endsWith('.xcworkspace')?'-workspace':'-project';const destination=simulatorDestination();if(!destination)return {ok:false,code:78,stdout:'',stderr:'no available iOS Simulator device',timedOut:false};const base=[flag,project,'-scheme',profile.scheme,'-sdk','iphonesimulator','-configuration','Debug','-destination',destination,'-derivedDataPath',path.join(work,'DerivedData')];const tests=await run('xcodebuild',[...base,'test'],work);const build=tests.ok?await run('xcodebuild',[...base,'build'],work):tests;return {ok:Boolean(build.ok),code:build.code,signal:build.signal,timedOut:build.timedOut,stdout:[tests.stdout,build.stdout].filter(Boolean).join('\n'),stderr:[tests.stderr,build.stderr].filter(Boolean).join('\n'),tests};}const tests=await run('swift',['test'],work);const build=tests.ok?await run('swift',['build'],work):tests;return {ok:Boolean(build.ok),code:build.code,signal:build.signal,timedOut:build.timedOut,stdout:[tests.stdout,build.stdout].filter(Boolean).join('\n'),stderr:[tests.stderr,build.stderr].filter(Boolean).join('\n'),tests};}

const server=http.createServer(async(req,res)=>{
  if(req.method==='GET'&&req.url==='/health')return json(res,200,{ok:true,runner:'macos-xcode',xcode:true,active,capacity:MAX_CONCURRENCY,ephemeral:process.env.CODINGVIBES_MACOS_EPHEMERAL==='true',artifactUploadConfigured:Boolean(ARTIFACT_URL)});
  if(req.method!=='POST'||req.url!=='/build')return json(res,404,{error:'not found'});
  if(req.headers.authorization!==`Bearer ${TOKEN}`)return json(res,401,{error:'unauthorized'});
  if(active>=MAX_CONCURRENCY)return json(res,429,{error:'runner busy'});
  active++;let work=null;
  try{
    const body=await read(req);if(body.schema!=='codingvibes.macos-job.v3')throw new Error('unsupported job schema');if(body.target!=='ios-swiftui')throw new Error('unsupported target');if(!body.jobId||!validScheme(body.profile?.scheme))throw new Error('invalid job profile');
    const digest=manifestDigest(body.files||[]);if(body.workspaceManifest!==digest)throw new Error('workspace manifest mismatch');
    work=path.join(ROOT,crypto.randomUUID());fs.mkdirSync(work,{recursive:true,mode:0o700});writeFiles(work,body.files||[]);fs.mkdirSync(path.join(work,'.tmp'),{recursive:true,mode:0o700});
    const result=await buildIos(work,body.profile);let artifacts=[];let uploads=[];if(result.ok){artifacts=collectArtifacts(work);for(const artifact of artifacts){const upload=await uploadArtifact(artifact.path);uploads.push({...artifact,upload});}}
    const testsOk=Boolean(result.tests?.ok);const uploadsOk=uploads.length>0&&uploads.every(x=>x.upload.uploaded&&x.upload.acknowledged);const ok=result.ok&&testsOk&&artifacts.length>0&&uploadsOk;
    const artifactUrls=uploads.map(x=>x.upload.url).filter(Boolean);
    const safeArtifacts=artifacts.map(a=>({path:path.relative(work,a.path),size:a.size,sha256:a.sha256,extension:a.extension}));
    const safeUploads=uploads.map(x=>({path:path.relative(work,x.path),size:x.size,sha256:x.sha256,extension:x.extension,upload:x.upload}));
    for(const artifact of artifacts)if(artifact.extension==='.app.zip')try{fs.rmSync(artifact.path,{force:true})}catch{}
    fs.rmSync(work,{recursive:true,force:true});work=null;
    return json(res,ok?200:422,{ok,status:ok?'verified':result.ok?(testsOk?'artifact-upload-failed':'tests-failed'):'failed',jobId:body.jobId,workspaceManifest:digest,results:[result],artifacts:safeArtifacts,uploads:safeUploads,artifactUrls,ephemeral:process.env.CODINGVIBES_MACOS_EPHEMERAL==='true'});
  }catch(e){if(work)try{fs.rmSync(work,{recursive:true,force:true})}catch{}return json(res,400,{ok:false,error:e.message});}finally{active--;}
});
server.listen(PORT,()=>console.log(`codingVibes macOS runner listening on :${PORT}`));
