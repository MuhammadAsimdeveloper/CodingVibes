import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

const SKIP=new Set(['.git','node_modules','.codingvibes','dist','build','.next','.expo','.gradle']);
const EXT=/\.(js|jsx|ts|tsx|mjs|cjs|html|css|scss|json|md|dart|kt|kts|swift|rs|py|go|java|yaml|yml|sql)$/i;

export function buildRepositoryIndex(root,{maxFiles=12000,maxBytes=8_000_000}={}){
  const files=[]; const symbols=[]; const imports=[]; let bytes=0;
  function walk(dir){
    if(files.length>=maxFiles||bytes>=maxBytes)return;
    for(const name of fs.readdirSync(dir,{withFileTypes:true})){
      if(SKIP.has(name.name))continue;
      const full=path.join(dir,name.name); const rel=path.relative(root,full).split(path.sep).join('/');
      if(name.isDirectory()){walk(full);continue;}
      if(!EXT.test(name.name))continue;
      let content=''; try{content=fs.readFileSync(full,'utf8')}catch{continue;}
      const size=Buffer.byteLength(content); if(bytes+size>maxBytes)continue; bytes+=size;
      const hash=createHash('sha256').update(content).digest('hex');
      files.push({path:rel,size,hash,language:language(name.name)});
      for(const m of content.matchAll(/\b(?:export\s+)?(?:async\s+)?(?:function|class)\s+([A-Za-z_$][\w$]*)|\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=|\binterface\s+([A-Za-z_$][\w$]*)/g)) symbols.push({path:rel,name:m[1]||m[2]||m[3]});
      for(const m of content.matchAll(/(?:from\s+['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"])/g)) imports.push({path:rel,specifier:m[1]||m[2]});
    }
  }
  walk(root);
  return {version:1,generatedAt:new Date().toISOString(),root:fileRoot(root),fileCount:files.length,totalBytes:bytes,files,symbols:symbols.slice(0,30000),imports:imports.slice(0,30000)};
}
function fileRoot(root){return path.basename(path.resolve(root));}
function language(name){const e=path.extname(name).toLowerCase();return ({'.js':'javascript','.jsx':'javascript','.ts':'typescript','.tsx':'typescript','.mjs':'javascript','.html':'html','.css':'css','.scss':'scss','.json':'json','.dart':'dart','.kt':'kotlin','.kts':'kotlin','.swift':'swift','.rs':'rust','.py':'python','.go':'go','.java':'java','.yaml':'yaml','.yml':'yaml','.sql':'sql','.md':'markdown'})[e]||'text';}
