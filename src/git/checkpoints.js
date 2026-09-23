import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';

const SKIP=new Set(['.git','node_modules','.codingvibes']);
function copyTree(src,dst){
  fs.mkdirSync(dst,{recursive:true});
  for(const entry of fs.readdirSync(src,{withFileTypes:true})){
    if(SKIP.has(entry.name))continue;
    const from=path.join(src,entry.name),to=path.join(dst,entry.name);
    if(entry.isDirectory())copyTree(from,to); else if(entry.isFile()){fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);}
  }
}
function clearWorktree(root){
  for(const entry of fs.readdirSync(root,{withFileTypes:true})){
    if(SKIP.has(entry.name))continue;
    fs.rmSync(path.join(root,entry.name),{recursive:true,force:true});
  }
}

export function createCheckpoint(workspace,root,label='checkpoint'){
  const id=randomUUID();
  const checkpointRoot=path.resolve(root,id);
  fs.mkdirSync(checkpointRoot,{recursive:true});
  copyTree(path.resolve(workspace),checkpointRoot);
  return {id,path:checkpointRoot,name:String(label).slice(0,120)};
}
export function restoreCheckpoint(workspace,checkpointPath){
  const src=path.resolve(checkpointPath),dst=path.resolve(workspace);
  if(!fs.existsSync(src)||!fs.statSync(src).isDirectory())throw new Error('Checkpoint not found');
  clearWorktree(dst);copyTree(src,dst);return {ok:true,path:src};
}
