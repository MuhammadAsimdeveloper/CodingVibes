import fs from 'node:fs';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {randomUUID} from 'node:crypto';

const exec=promisify(execFile);
const GITHUB_NAME=/^[A-Za-z0-9](?:[A-Za-z0-9._-]{0,98})$/;

export function normalizeGitHubRepo(input={}){
  const owner=String(input.owner||'').trim().replace(/^@/,'');
  const repo=String(input.repo||'').trim().replace(/\.git$/i,'');
  const ref=String(input.ref||'').trim();
  if(!GITHUB_NAME.test(owner)||!GITHUB_NAME.test(repo))throw new Error('valid GitHub owner and repository are required');
  if(ref.length>200||/[\0\r\n]/.test(ref))throw new Error('invalid GitHub ref');
  return {owner,repo,ref};
}

function safeName(value){return String(value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'imported-project';}
function sanitizeError(message,token){const text=String(message||'');return token?text.split(token).join('[redacted]').slice(0,1200):text.slice(0,1200);}

export async function importGitHubRepository({owner,repo,ref='',projectName,token=process.env.GITHUB_TOKEN,root=process.env.CODINGVIBES_PROJECT_ROOT||'./data/projects'}={}){
  const source=normalizeGitHubRepo({owner,repo,ref});
  const projectLabel=String(projectName||`${source.owner}/${source.repo}`).trim().slice(0,80)||source.repo;
  const base=path.resolve(root);fs.mkdirSync(base,{recursive:true});
  const temp=path.join(base,`.github-import-${randomUUID()}`);const destination=path.join(base,`${safeName(projectLabel)}-${randomUUID().slice(0,8)}`);
  const env={...process.env,GIT_TERMINAL_PROMPT:'0'};
  if(token){
    env.GIT_CONFIG_COUNT='1';
    env.GIT_CONFIG_KEY_0='http.https://github.com/.extraheader';
    env.GIT_CONFIG_VALUE_0=`AUTHORIZATION: basic ${Buffer.from(`x-access-token:${token}`).toString('base64')}`;
  }
  const args=['clone','--depth','1','--single-branch','--no-tags','--filter=blob:none'];
  if(source.ref)args.push('--branch',source.ref);
  args.push(`https://github.com/${source.owner}/${source.repo}.git`,temp);
  try{
    await exec('git',args,{env,cwd:base,timeout:Number(process.env.CODINGVIBES_GITHUB_CLONE_TIMEOUT_MS||180000),maxBuffer:4*1024*1024});
    if(!fs.existsSync(path.join(temp,'.git')))throw new Error('GitHub clone completed without a Git repository');
    await exec('git',['config','user.name',process.env.GIT_AUTHOR_NAME||'codingVibes'],{cwd:temp,timeout:30000});
    await exec('git',['config','user.email',process.env.GIT_AUTHOR_EMAIL||'agent@codingvibes.local'],{cwd:temp,timeout:30000});
    fs.renameSync(temp,destination);
    return {ok:true,owner:source.owner,repo:source.repo,ref:source.ref||null,name:projectLabel,repoPath:destination,branch:(await exec('git',['branch','--show-current'],{cwd:destination,timeout:30000})).stdout.trim()||null};
  }catch(e){
    try{fs.rmSync(temp,{recursive:true,force:true});}catch{}
    try{fs.rmSync(destination,{recursive:true,force:true});}catch{}
    throw new Error(`github_import_failed: ${sanitizeError(e.stderr||e.message,token)}`);
  }
}
