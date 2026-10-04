import fs from 'node:fs';
import path from 'node:path';

function htmlFiles(root){
  const out=[];const walk=dir=>{if(!fs.existsSync(dir))return;for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['node_modules','.git','.codingvibes'].includes(e.name))continue;const full=path.join(dir,e.name);if(e.isDirectory())walk(full);else if(e.isFile()&&e.name.endsWith('.html'))out.push(full);}};walk(root);return out;
}
function has(html,re){return re.test(html)}
export function auditDiscoverability(root,{baseUrl='__SITE_URL__'}={}){
  const files=htmlFiles(root),issues=[],warnings=[],pages=[];
  if(!files.length)issues.push('No HTML pages found');
  for(const file of files){
    const html=fs.readFileSync(file,'utf8'),name=path.basename(file),route=name==='index.html'?'/':'/'+name.replace(/\.html$/,'');
    const page={file:name,route,title:has(html,/<title>[^<]{3,80}<\/title>/i),description:has(html,/<meta[^>]+name=["']description["'][^>]+content=["'][^"']{20,160}["']/i),canonical:has(html,/<link[^>]+rel=["']canonical["'][^>]*>/i),og:has(html,/property=["']og:title["']/i),twitter:has(html,/name=["']twitter:card["']/i),jsonLd:has(html,/application\/ld\+json/i),faq:has(html,/FAQ|Frequently asked|questions/i),headings:has(html,/<h1\b/i)};
    pages.push(page);for(const key of ['title','description','canonical','headings'])if(!page[key])issues.push(name+': missing '+key);if(!page.jsonLd)warnings.push(name+': missing JSON-LD');if(!page.og||!page.twitter)warnings.push(name+': incomplete social metadata');
  }
  for(const required of ['robots.txt','sitemap.xml','llms.txt'])if(!fs.existsSync(path.join(root,required)))issues.push('missing '+required);
  const llmsPath=path.join(root,'llms.txt');if(fs.existsSync(llmsPath)&&!/^#\s/m.test(fs.readFileSync(llmsPath,'utf8')))warnings.push('llms.txt is not structured with a title');
  const titles=pages.map(x=>fs.readFileSync(path.join(root,x.file),'utf8').match(/<title>([^<]+)<\/title>/i)?.[1]||x.file);if(new Set(titles).size!==titles.length)issues.push('Duplicate page titles detected');
  return {ok:issues.length===0,score:Math.max(0,100-Math.min(80,issues.length*12)-Math.min(20,warnings.length*4)),baseUrl,pages,issues,warnings,checkedAt:new Date().toISOString()};
}
export function aeoSummary(audit){return {score:audit.score,ready:audit.ok,answerEngineReady:audit.ok&&audit.pages.every(p=>p.jsonLd&&p.description&&p.headings),issues:audit.issues.slice(0,20),warnings:audit.warnings.slice(0,20)}}