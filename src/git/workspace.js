import fs from 'node:fs';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile);
async function git(cwd,args){try{const r=await exec('git',args,{cwd,timeout:120000,maxBuffer:8*1024*1024});return {ok:true,code:0,stdout:r.stdout,stderr:r.stderr};}catch(e){return {ok:false,code:e.code??1,stdout:e.stdout||'',stderr:e.stderr||e.message};}}
export async function createAgentWorkspace(repoRoot,runId){
 const root=path.resolve(repoRoot), workRoot=path.resolve(process.env.CODINGVIBES_WORK_ROOT||path.join(root,'workspaces'));fs.mkdirSync(workRoot,{recursive:true});const worktree=path.join(workRoot,runId);const branch=`cv/${runId.replace(/[^a-zA-Z0-9_-]/g,'').slice(0,50)}`;
 const current=await git(root,['rev-parse','--verify','HEAD']); if(!current.ok)throw new Error(`Repository is not initialized: ${current.stderr}`);
 const r=await git(root,['worktree','add','-b',branch,worktree,current.stdout.trim()]);if(!r.ok)throw new Error(`Unable to create worktree: ${r.stderr}`);
 return {worktree,branch,baseSha:current.stdout.trim()};
}
export async function inspectWorkspace(worktree){const [status,diff,branch]=await Promise.all([git(worktree,['status','--short','--branch']),git(worktree,['diff']),git(worktree,['branch','--show-current'])]);return {status,diff,branch:branch.stdout.trim()};}
export async function commitWorkspace(worktree,message){const add=await git(worktree,['add','-A']);if(!add.ok)throw new Error(add.stderr);const c=await git(worktree,['commit','-m',message]);return c;}
export async function revertWorkspace(worktree,ref='HEAD'){return git(worktree,['revert','--no-edit',ref]);}
export async function cleanupWorkspace(repoRoot,worktree){await git(repoRoot,['worktree','remove','--force',worktree]);}
