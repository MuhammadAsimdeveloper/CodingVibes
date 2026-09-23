import fs from 'node:fs';
import path from 'node:path';

export function normalizeRelative(input){
  const raw=String(input??'');
  if(raw.includes('\0'))throw new Error('Null bytes are not allowed in paths');
  const normalized=path.posix.normalize(raw.replaceAll('\\','/'));
  if(!normalized || normalized==='.' || normalized.startsWith('/') || normalized==='..' || normalized.startsWith('../') || normalized.includes('/../'))throw new Error('Path escapes workspace');
  return normalized;
}

export function assertWritablePath(input){
  const rel=normalizeRelative(input);
  const parts=rel.split('/');
  const top=parts[0].toLowerCase();
  const base=parts.at(-1).toLowerCase();
  if(top==='.git'||top==='.codingvibes'||top==='node_modules')throw new Error('Protected workspace path');
  if(base==='.env'||base.startsWith('.env.')||base.endsWith('.pem')||base.endsWith('.key')||base.includes('credentials'))throw new Error('Sensitive file writes are blocked');
  return rel;
}

function nearestExisting(p){
  let current=p;
  while(!fs.existsSync(current)){
    const parent=path.dirname(current);
    if(parent===current)break;
    current=parent;
  }
  return current;
}

export function resolveInside(root,input,{forWrite=false}={}){
  const base=fs.realpathSync(path.resolve(root));
  const rel=forWrite?assertWritablePath(input):normalizeRelative(input);
  const candidate=path.resolve(base,rel);
  const checkTarget=forWrite?nearestExisting(path.dirname(candidate)):candidate;
  const real=fs.existsSync(candidate)?fs.realpathSync(candidate):fs.realpathSync(checkTarget);
  const relative=path.relative(base,real);
  if(relative.startsWith('..'+path.sep)||path.isAbsolute(relative))throw new Error('Path escapes workspace');
  if(fs.existsSync(candidate)&&fs.lstatSync(candidate).isSymbolicLink())throw new Error('Symlink targets are not allowed');
  return candidate;
}
