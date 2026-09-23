import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {normalizeRelative} from '../core/safe-path.js';

const MAX_FILES=80;
const MAX_BYTES_PER_FILE=9000;
const MAX_TOTAL_BYTES=180000;
const SKIP_DIRS=new Set(['.git','node_modules','.codingvibes','coverage','dist','build','.next','.cache','data']);
const SENSITIVE_NAMES=new Set(['.env','.env.local','.env.production','.env.development','.npmrc','.pypirc']);

function isSensitive(rel){
  const base=path.posix.basename(rel).toLowerCase();
  return SENSITIVE_NAMES.has(base)||base.endsWith('.pem')||base.endsWith('.key')||base.includes('credentials');
}
function looksText(buf){return !buf.subarray(0,4096).includes(0);}
function trackedFiles(root){
  try{return execFileSync('git',['ls-files','-co','--exclude-standard'],{cwd:root,encoding:'utf8',maxBuffer:2*1024*1024,stdio:['ignore','pipe','ignore']}).split(/\r?\n/).filter(Boolean);}catch{return null;}
}
function walk(root,dir=root,out=[]){
  if(out.length>=MAX_FILES)return out;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(out.length>=MAX_FILES)break;
    const full=path.join(dir,entry.name),rel=path.relative(root,full).split(path.sep).join('/');
    if(entry.isDirectory()){if(!SKIP_DIRS.has(entry.name))walk(root,full,out);continue;}
    if(entry.isFile()&&!SKIP_DIRS.has(path.posix.dirname(rel).split('/')[0])&&!isSensitive(rel))out.push(rel);
  }
  return out;
}

export function collectProjectContext(root,{index=null,focus=''}={}){
  const base=path.resolve(root);
  const fallback=trackedFiles(base)||walk(base);
  const indexed=Array.isArray(index?.files)?index.files.map(x=>x.path):[];
  const candidates=[...new Set([...(indexed.length?indexed:fallback),...fallback])];
  const needles=String(focus||'').toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>2).slice(0,40);
  const ranked=candidates.map((rel,position)=>{
    const lower=rel.toLowerCase();let score=0;
    if(/(^|\/)(package\.json|vite\.config\.|next\.config\.|src\/main\.|src\/app\.|app\/page\.|index\.(js|ts|jsx|tsx))$/.test(lower))score+=8;
    for(const needle of needles)if(lower.includes(needle))score+=3;
    const indexedEntry=index?.files?.find(x=>x.path===rel);
    score+=Math.max(0,3-Math.min(3,Number(indexedEntry?.imports?.length||0)/20));
    for(const symbol of (indexedEntry?.symbols||[])){const sym=String(symbol.name||symbol).toLowerCase();if(needles.some(n=>sym.includes(n)))score+=5;}
    const importText=(indexedEntry?.imports||[]).join(' ').toLowerCase();for(const needle of needles)if(importText.includes(needle))score+=1;
    return {rel,score,position};
  }).sort((a,b)=>b.score-a.score||a.position-b.position).map(x=>x.rel);
  const files=[],tree=[];let totalBytes=0,truncated=false;
  for(const raw of ranked){
    let rel;try{rel=normalizeRelative(raw);}catch{continue;}
    if(isSensitive(rel)||SKIP_DIRS.has(rel.split('/')[0]))continue;
    const target=path.join(base,rel);
    let stat;try{stat=fs.statSync(target);}catch{continue;}
    tree.push(rel);
    if(!stat.isFile()||stat.size>MAX_BYTES_PER_FILE||totalBytes>=MAX_TOTAL_BYTES)continue;
    let buf;try{buf=fs.readFileSync(target);}catch{continue;}
    if(!looksText(buf)){continue;}
    const room=Math.max(0,MAX_TOTAL_BYTES-totalBytes);
    const content=buf.toString('utf8').slice(0,Math.min(MAX_BYTES_PER_FILE,room));
    if(content.length<buf.length)truncated=true;
    totalBytes+=Buffer.byteLength(content);
    files.push({path:rel,content});
    if(files.length>=MAX_FILES){truncated=true;break;}
  }
  return {root:base,files,tree:tree.slice(0,MAX_FILES),truncated,totalBytes,maxFiles:MAX_FILES,maxBytesPerFile:MAX_BYTES_PER_FILE,selection:{focused:Boolean(needles.length),indexUsed:Boolean(indexed.length),candidateCount:candidates.length}};
}

export function formatContextForModel(context){
  const sections=context.files.map(f=>`<untrusted_file path="${f.path}">\n${f.content}\n</untrusted_file>`).join('\n');
  return `<untrusted_project_tree>\n${context.tree.join('\n')}\n</untrusted_project_tree>\n<untrusted_project_files>\n${sections}\n</untrusted_project_files>`;
}
