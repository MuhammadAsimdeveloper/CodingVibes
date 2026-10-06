import {spawn} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let child=null;
async function waitForHealth(url,timeoutMs=20000){
  const end=Date.now()+timeoutMs;
  while(Date.now()<end){
    try{const r=await fetch(url);if(r.ok)return true;}catch{}
    await new Promise(r=>setTimeout(r,250));
  }
  return false;
}
async function autoStart(){
  if(String(process.env.CODINGVIBES_LOAD_AUTOSTART||'false')!=='true')return;
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'build-vibe-load-'));
  const env={...process.env,DATABASE_PATH:path.join(root,'db.sqlite'),CODINGVIBES_PROJECT_ROOT:path.join(root,'projects'),CODINGVIBES_WORK_ROOT:path.join(root,'worktrees'),CODINGVIBES_CHECKPOINT_ROOT:path.join(root,'checkpoints'),CODINGVIBES_BACKUP_ROOT:path.join(root,'backups')};
  child=spawn(process.execPath,['src/server.js'],{env,stdio:'ignore'});
  if(!await waitForHealth(baseUrl+'/health'))throw new Error('load_autostart_failed');
}
import {performance} from 'node:perf_hooks';

const baseUrl=String(process.env.CODINGVIBES_LOAD_URL||process.env.BASE_URL||'http://127.0.0.1:4400').replace(/\/$/,'');
const levels=String(process.env.CODINGVIBES_LOAD_LEVELS||'10,25,50').split(',').map(x=>Math.max(1,Math.min(50,Number(x)||1)));
const perLevel=Math.max(1,Math.min(200,Number(process.env.CODINGVIBES_LOAD_REQUESTS_PER_LEVEL||20)));
const p95Limit=Number(process.env.CODINGVIBES_LOAD_P95_MS||1000);

async function runLevel(concurrency){
  let cursor=0;const latencies=[],failures=[];const started=performance.now();
  async function worker(){
    while(true){
      const i=cursor++;if(i>=perLevel)return;
      const t=performance.now();
      try{
        const r=await fetch(baseUrl+'/health',{cache:'no-store'});
        latencies.push(performance.now()-t);
        if(!r.ok)failures.push({status:r.status});
      }catch(error){latencies.push(performance.now()-t);failures.push({error:String(error?.message||error)});}
    }
  }
  await Promise.all(Array.from({length:concurrency},worker));
  const sorted=latencies.slice().sort((a,b)=>a-b),p95=sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*.95)-1)]||0;
  return{concurrency,requests:perLevel,elapsedMs:Math.round((performance.now()-started)*100)/100,p95Ms:Math.round(p95*100)/100,failures:failures.length,passed:failures.length===0&&p95<=p95Limit};
}

try{
  await autoStart();
  const probe=await fetch(baseUrl+'/health');
  if(!probe.ok)throw new Error('health_probe_http_'+probe.status);
}catch(error){
  console.error(JSON.stringify({status:'BLOCKED',reason:'load_target_unreachable',baseUrl,error:String(error?.message||error)},null,2));
  process.exit(2);
}
const results=[];for(const level of levels)results.push(await runLevel(level));
const ok=results.every(x=>x.passed);
console.log(JSON.stringify({status:ok?'PASS':'FAIL',baseUrl,p95LimitMs:p95Limit,results},null,2));
if(!ok)process.exit(1);
}finally{if(child)child.kill('SIGTERM');}
