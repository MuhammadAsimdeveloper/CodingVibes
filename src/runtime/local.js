import {spawn} from 'node:child_process';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
const open=(port,host='127.0.0.1')=>new Promise(resolve=>{const s=net.createConnection({port,host});s.once('connect',()=>{s.destroy();resolve(true)});s.once('error',()=>resolve(false));});
async function freePort(start=4300){for(let p=start;p<start+100;p++)if(!await open(p))return p;throw new Error('No free preview port');}
async function waitFor(url){const deadline=Date.now()+15000;let last='';while(Date.now()<deadline){try{const r=await fetch(url);if(r.ok||r.status<500)return;}catch(e){last=e.message}await new Promise(r=>setTimeout(r,150))}throw new Error(`Preview did not become ready: ${last}`)}
export async function startLocalPreview(workspace,{host='127.0.0.1',dependencyApproved=false}={}){
 if(process.env.NODE_ENV==='production'&&process.env.CODINGVIBES_ALLOW_HOST_EXECUTION!=='true')throw new Error('Host preview execution is disabled in production. Use Daytona or container runtime.');
 const port=await freePort(),logPath=path.join(workspace,'.codingvibes-preview.log'),logFd=fs.openSync(logPath,'a');
 if(dependencyApproved && fs.existsSync(path.join(workspace,'package.json'))){const cmd=fs.existsSync(path.join(workspace,'package-lock.json'))?['npm','ci']:['npm','install'];const install=await new Promise(resolve=>{const c=spawn(cmd[0],cmd.slice(1),{cwd:workspace,env:{...process.env,NODE_TEST_CONTEXT:undefined},stdio:['ignore','pipe','pipe']});let stdout='',stderr='';c.stdout.on('data',d=>stdout+=d);c.stderr.on('data',d=>stderr+=d);c.on('exit',code=>resolve({ok:code===0,stdout,stderr}));});if(!install.ok)throw new Error(`dependency_install_failed: ${install.stderr||install.stdout}`);}
 const child=spawn(process.execPath,['app/server.js'],{cwd:workspace,env:{...process.env,NODE_TEST_CONTEXT:undefined,HOST:host,PORT:String(port),NODE_ENV:'development'},stdio:['ignore',logFd,logFd]});
 const url=`http://${host}:${port}`;
 const stop=async()=>{try{if(child.exitCode===null){child.kill('SIGTERM');await new Promise(resolve=>{const t=setTimeout(resolve,2500);child.once('exit',()=>{clearTimeout(t);resolve()});});if(child.exitCode===null){try{child.kill('SIGKILL')}catch{}}}}finally{try{fs.closeSync(logFd)}catch{}}};
 try{await waitFor(`${url}/api/health`);return{kind:'local',url,port,process:child,logPath,exec:async(command,args=[])=>new Promise(resolve=>{const c=spawn(command,args,{cwd:workspace,env:{...process.env,NODE_TEST_CONTEXT:undefined},stdio:['ignore','pipe','pipe']});let stdout='',stderr='';c.stdout.on('data',d=>stdout+=d);c.stderr.on('data',d=>stderr+=d);const t=setTimeout(()=>{try{c.kill('SIGKILL')}catch{}resolve({ok:false,code:124,stdout,stderr:'command timeout'})},120000);c.on('exit',code=>{clearTimeout(t);resolve({ok:code===0,code:code??1,stdout,stderr})});}),stop};}catch(e){await stop();throw e;}
}
