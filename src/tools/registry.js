import fs from 'node:fs';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {resolveInside} from '../core/safe-path.js';
import crypto from 'node:crypto';
import {runCommand} from '../runners/command.js';
const exec=promisify(execFile);
const PERM={read:'safe',write:'review',run:'safe',test:'safe',check:'safe',git_status:'safe',git_diff:'safe',git_commit:'review',git_revert:'dangerous'};
export class ToolRegistry{
 constructor({workspace,store,runId,confirm=async()=>false,runner=null,signal}={}){this.workspace=workspace;this.store=store;this.runId=runId;this.confirm=confirm;this.runner=runner;this.signal=signal;}
 async call(tool,input={}){if(this.signal?.aborted)throw Object.assign(new Error('run_cancelled'),{code:'RUN_CANCELLED'});const permission=PERM[tool]||'dangerous';if(permission!=='safe'&&!(await this.confirm({tool,input,permission})))throw new Error(`Permission denied for ${tool}`);const before=this.snapshot();try{const result=await this.#run(tool,input);this.store?.toolCall(this.runId,tool,permission,input,before,this.snapshot(),result);return result;}catch(e){const result={ok:false,error:e.message};this.store?.toolCall(this.runId,tool,permission,input,before,this.snapshot(),result);throw e;}}
 snapshot(){try{const files=[];const walk=(dir,rel='')=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(entry.name==='.git'||entry.name==='node_modules'||entry.name==='.codingvibes')continue;const nextRel=rel?`${rel}/${entry.name}`:entry.name;const full=path.join(dir,entry.name);if(entry.isDirectory()){if(files.length<120)walk(full,nextRel);continue;}if(entry.isFile()&&files.length<120){const buf=fs.readFileSync(full);files.push({path:nextRel,size:buf.length,sha256:crypto.createHash('sha256').update(buf).digest('hex')});}}};walk(this.workspace);return{files}}catch{return{files:[]}}}
 async #run(tool,input){
   if(tool==='read')return{ok:true,content:fs.readFileSync(resolveInside(this.workspace,input.path),'utf8')};
   if(tool==='write'){const target=resolveInside(this.workspace,input.path,{forWrite:true});fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,String(input.content??''),'utf8');return{ok:true,path:input.path};}
   if(tool==='git_status')return this.#git(['status','--short','--branch']);if(tool==='git_diff')return this.#git(['diff']);if(tool==='git_commit'){const a=await this.#git(['add','-A']);if(!a.ok)return a;return this.#git(['commit','-m',String(input.message||'codingVibes changeset')]);}if(tool==='git_revert')return this.#git(['revert','--no-edit',String(input.ref||'HEAD')]);
   if(tool==='check')return this.#exec('npm',['run','check']);if(tool==='test')return this.#exec('npm',['test']);if(tool==='run')return this.#exec(String(input.command),Array.isArray(input.args)?input.args:[]);
   throw new Error(`Unknown tool: ${tool}`);
 }
 async #git(args){return this.#exec('git',args);}
 async #exec(command,args){if(this.runner){if(this.signal?.aborted)throw Object.assign(new Error('run_cancelled'),{code:'RUN_CANCELLED'});const r=await this.runner(command,args);if(this.signal?.aborted)throw Object.assign(new Error('run_cancelled'),{code:'RUN_CANCELLED'});return r;}return runCommand(command,args,{cwd:this.workspace,timeoutMs:120000,allowlist:new Set(['git','npm','node','npx','bash','gradle','java','adb','flutter','dart','swift','xcodebuild','cargo','rustc','eas','gradlew','gradlew.bat']),signal:this.signal});}
}
