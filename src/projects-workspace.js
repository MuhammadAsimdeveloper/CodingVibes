import fs from 'node:fs';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile);

async function git(cwd,args){try{return await exec('git',args,{cwd,timeout:120000,maxBuffer:4*1024*1024});}catch(e){throw new Error(e.stderr||e.message);}}
function slug(s){return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'project';}

export async function ensureProjectRepository(project,{root=process.env.CODINGVIBES_PROJECT_ROOT||'./data/projects'}={}){
  if(project.repo_path && fs.existsSync(path.join(project.repo_path,'.git')))return project.repo_path;
  const repoRoot=path.resolve(root);fs.mkdirSync(repoRoot,{recursive:true});
  const repo=path.join(repoRoot,`${slug(project.name)}-${project.id.slice(0,8)}`);fs.mkdirSync(repo,{recursive:true});
  if(!fs.existsSync(path.join(repo,'.git'))){
    fs.writeFileSync(path.join(repo,'README.md'),`# ${project.name}\n\nGenerated and verified with codingVibes.\n`);
    fs.writeFileSync(path.join(repo,'.gitignore'),'node_modules/\ndata/\n.env\n.codingvibes-preview.log\n.codingvibes-preview-container.log\n.codingvibes/\n');
    await git(repo,['init','-b','main']);
    await git(repo,['config','user.name',process.env.GIT_AUTHOR_NAME||'codingVibes']);
    await git(repo,['config','user.email',process.env.GIT_AUTHOR_EMAIL||'agent@codingvibes.local']);
    await git(repo,['add','.']); await git(repo,['commit','-m','Initialize codingVibes project']);
  }
  return repo;
}
