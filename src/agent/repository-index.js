import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

const SKIP=new Set(['.git','node_modules','.codingvibes','dist','build','.next','.expo','.gradle','coverage','.cache']);
const EXT=/\.(js|jsx|ts|tsx|mjs|cjs|html|css|scss|json|md|dart|kt|kts|swift|rs|py|go|java|yaml|yml|sql)$/i;
const IMPORT_RE=/(?:from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\))/g;
const SYMBOL_RE=/\b(?:export\s+)?(?:async\s+)?(?:function|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)|\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=|\b(?:def|func)\s+([A-Za-z_$][\w$]*)/g;
const ROUTE_RE=/(?:app|router|route)\.(?:get|post|put|patch|delete|use)\(\s*['"]([^'"]+)['"]/g;
const EXPORT_RE=/export\s+(?:default\s+)?(?:function|class|const|let|var|async\s+function)\s+([A-Za-z_$][\w$]*)/g;

export function buildRepositoryIndex(root,{maxFiles=12000,maxBytes=8_000_000}={}){
  const files=[],symbols=[],imports=[],routes=[],exports=[];let bytes=0;
  function walk(dir){
    if(files.length>=maxFiles||bytes>=maxBytes)return;
    for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
      if(SKIP.has(entry.name))continue;
      const full=path.join(dir,entry.name),rel=path.relative(root,full).split(path.sep).join('/');
      if(entry.isDirectory()){walk(full);continue;}
      if(!EXT.test(entry.name))continue;
      let content='';try{content=fs.readFileSync(full,'utf8')}catch{continue;}
      const size=Buffer.byteLength(content);if(bytes+size>maxBytes)continue;bytes+=size;
      const hash=createHash('sha256').update(content).digest('hex');
      const lineCount=content.split(/\r?\n/).length;
      files.push({path:rel,size,hash,language:language(entry.name),lineCount});
      for(const m of content.matchAll(SYMBOL_RE))symbols.push({path:rel,name:m[1]||m[2]||m[3],kind:m[1]?'declaration':'binding'});
      for(const m of content.matchAll(IMPORT_RE))imports.push({path:rel,specifier:m[1]||m[2]||m[3]});
      for(const m of content.matchAll(ROUTE_RE))routes.push({path:rel,route:m[1]});
      for(const m of content.matchAll(EXPORT_RE))exports.push({path:rel,name:m[1]});
    }
  }
  walk(root);
  return {version:2,generatedAt:new Date().toISOString(),root:path.basename(path.resolve(root)),fileCount:files.length,totalBytes:bytes,files,symbols:symbols.slice(0,50000),imports:imports.slice(0,50000),routes:routes.slice(0,20000),exports:exports.slice(0,30000)};
}

export function searchRepositoryIndex(index,query,{limit=30}={}){
  const q=String(query||'').toLowerCase().trim();if(!q)return[];
  const terms=q.split(/[^a-z0-9_$./:-]+/).filter(Boolean);
  const score=(text)=>terms.reduce((n,t)=>n+(text.includes(t)?1:0),0);
  return index.files.map(f=>{const syms=index.symbols.filter(s=>s.path===f.path).map(s=>s.name);const imps=index.imports.filter(i=>i.path===f.path).map(i=>i.specifier);const routes=index.routes.filter(r=>r.path===f.path).map(r=>r.route);const text=[f.path,f.language,...syms,...imps,...routes].join(' ').toLowerCase();return{...f,score:score(text),symbols:syms.slice(0,40),imports:imps.slice(0,40),routes};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.path.localeCompare(b.path)).slice(0,limit);
}

function language(name){const e=path.extname(name).toLowerCase();return ({'.js':'javascript','.jsx':'javascript','.ts':'typescript','.tsx':'typescript','.mjs':'javascript','.html':'html','.css':'css','.scss':'scss','.json':'json','.dart':'dart','.kt':'kotlin','.kts':'kotlin','.swift':'swift','.rs':'rust','.py':'python','.go':'go','.java':'java','.yaml':'yaml','.yml':'yaml','.sql':'sql','.md':'markdown'})[e]||'text';}
