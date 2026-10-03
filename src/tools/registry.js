import fs from 'node:fs';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {resolveInside} from '../core/safe-path.js';
import crypto from 'node:crypto';
import {runCommand} from '../runners/command.js';
const exec=promisify(execFile);
const PERM={read:'safe',search:'safe',symbols:'safe',read_range:'safe',write:'review',patch:'review',delete:'review',rename:'review',run:'safe',test:'safe',check:'safe',git_status:'safe',git_diff:'safe',git_commit:'review',git_revert:'dangerous'};
const BLOCKED_TOP=new Set(['.git','.codingvibes','node_modules']);
const SECRET_RE=/(^|\/)(\.env(?:\..*)?|.*\.pem|.*\.key|.*credentials.*)$/i;

function safePath(workspace,p){const rel=String(p||'');const clean=rel.replaceAll('\\','/');if(BLOCKED_TOP.has(clean.split('/')[0])||(SECRET_RE.test(clean)&&clean!=='.env.example'))throw new Error('Protected path');return resolveInside(workspace,clean,{forWrite:true});}
function normalizeText(v){return String(v??'').replace(/\r\n/g,'\n');}
function locate(text,needle,occurrence=1){const n=normalizeText(needle);if(!n)throw new Error('patch oldText cannot be empty');let from=0,pos=-1;for(let i=0;i<occurrence;i++){pos=text.indexOf(n,from);if(pos<0)break;from=pos+n.length;}return pos;}

export class ToolRegistry{
 constructor({workspace,store,runId,confirm=async()=>false,runner=null,signal}={}){this.workspace=workspace;this.store=store;this.runId=runId;this.confirm=confirm;this.runner=runner;this.signal=signal;}
 async call(tool,input={}){if(this.signal?.aborted)throw Object.assign(new Error('run_cancelled'),{code:'RUN_CANCELLED'});const permission=PERM[tool]||'dangerous';if(permission!=='safe'&&!(await this.confirm({tool,input,permission})))throw new Error(`Permission denied for ${tool}`);const before=this.snapshot();try{const result=await this.#run(tool,input);this.store?.toolCall(this.runId,tool,permission,input,before,this.snapshot(),result);return result;}catch(e){const result={ok:false,error:e.message};this.store?.toolCall(this.runId,tool,permission,input,before,this.snapshot(),result);throw e;}}
 snapshot(){try{const files=[];const walk=(dir,rel='')=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(entry.name==='.git'||entry.name==='node_modules'||entry.name==='.codingvibes')continue;const nextRel=rel?rel+'/'+entry.name:entry.name;const full=path.join(dir,entry.name);if(entry.isDirectory()){if(files.length<120)walk(full,nextRel);continue;}if(entry.isFile()&&files.length<120){const buf=fs.readFileSync(full);files.push({path:nextRel,size:buf.length,sha256:crypto.createHash('sha256').update(buf).digest('hex')});}}};walk(this.workspace);return{files}}catch{return{files:[]}}}
 async #run(tool,input){
   if(tool==='read'){const p=safePath(this.workspace,input.path);return{ok:true,path:input.path,content:fs.readFileSync(p,'utf8')};}
   if(tool==='read_range'){const p=safePath(this.workspace,input.path),lines=fs.readFileSync(p,'utf8').split(/\r?\n/);const start=Math.max(1,Number(input.start)||1),end=Math.min(lines.length,Number(input.end)||start+200);return{ok:true,path:input.path,start,end,content:lines.slice(start-1,end).join('\n')};}
   if(tool==='search'){const needle=String(input.query||'').toLowerCase(),results=[];const walk=(dir,rel='')=>{if(results.length>=Number(input.limit)||0)return;for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['.git','node_modules','.codingvibes','dist','build'].includes(e.name))continue;const full=path.join(dir,e.name),r=rel?rel+'/'+e.name:e.name;if(e.isDirectory())walk(full,r);else if(e.isFile()&&/\.(js|jsx|ts|tsx|mjs|css|html|json|py|go|java|kt|swift|rs|dart)$/.test(e.name)){let c='';try{c=fs.readFileSync(full,'utf8')}catch{}const lines=c.split(/\r?\n/);lines.forEach((line,i)=>{if(results.length<Number(input.limit||50)&&line.toLowerCase().includes(needle))results.push({path:r,line:i+1,text:line.slice(0,500)});});}}};walk(this.workspace);return{ok:true,query:input.query,results};}
   if(tool==='symbols'){const c=fs.readFileSync(safePath(this.workspace,input.path),'utf8');const out=[];for(const m of c.matchAll(/\b(?:export\s+)?(?:async\s+)?(?:function|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)|\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/g))out.push({name:m[1]||m[2],offset:m.index});return{ok:true,path:input.path,symbols:out};}
   if(tool==='write'){const target=safePath(this.workspace,input.path);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,normalizeText(input.content),'utf8');return{ok:true,path:input.path,mode:'write'};}
   if(tool==='patch'){const target=safePath(this.workspace,input.path);const before=normalizeText(fs.readFileSync(target,'utf8'));const pos=locate(before,input.oldText,input.occurrence||1);if(pos<0)throw new Error(`Patch context not found in ${input.path}`);const old=normalizeText(input.oldText);const after=before.slice(0,pos)+normalizeText(input.newText)+before.slice(pos+old.length);fs.writeFileSync(target,after,'utf8');return{ok:true,path:input.path,mode:'patch',replaced:old.length};}
   if(tool==='delete'){fs.rmSync(safePath(this.workspace,input.path),{force:true});return{ok:true,path:input.path,mode:'delete'};}
   if(tool==='rename'){const from=safePath(this.workspace,input.from),to=safePath(this.workspace,input.to);fs.mkdirSync(path.dirname(to),{recursive:true});fs.renameSync(from,to);return{ok:true,from:input.from,to:input.to,mode:'rename'};}
   if(tool==='git_status')return this.#git(['status','--short','--branch']);if(tool==='git_diff')return this.#git(['diff']);if(tool==='git_commit'){const a=await this.#git(['add','-A']);if(!a.ok)return a;return this.#git(['commit','-m',String(input.message||'codingVibes changeset')]);}if(tool==='git_revert')return this.#git(['revert','--no-edit',String(input.ref||'HEAD')]);
   if(tool==='check')return this.#exec('npm',['run','check']);if(tool==='test')return this.#exec('npm',['test']);if(tool==='run')return this.#exec(String(input.command),Array.isArray(input.args)?input.args:[]);
   throw new Error(`Unknown tool: ${tool}`);
 }
 async #git(args){return this.#exec('git',args);}
 async #exec(command,args){if(this.runner){if(this.signal?.aborted)throw Object.assign(new Error('run_cancelled'),{code:'RUN_CANCELLED'});const r=await this.runner(command,args);if(this.signal?.aborted)throw Object.assign(new Error('run_cancelled'),{code:'RUN_CANCELLED'});return r;}return runCommand(command,args,{cwd:this.workspace,timeoutMs:120000,allowlist:new Set(['git','npm','node','npx','bash','gradle','java','adb','flutter','dart','swift','xcodebuild','cargo','rustc','eas','gradlew','gradlew.bat']),signal:this.signal});}
}
