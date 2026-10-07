import fs from 'node:fs';
import path from 'node:path';

function htmlFiles(root){
  const out=[];const walk=dir=>{if(!fs.existsSync(dir))return;for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['node_modules','.git','.codingvibes','.data'].includes(e.name))continue;const full=path.join(dir,e.name);if(e.isDirectory())walk(full);else if(e.isFile()&&e.name.endsWith('.html'))out.push(full);}};walk(root);return out;
}
function first(html,re){return html.match(re)?.[1]?.trim()||''}
function all(html,re){return [...html.matchAll(re)].map(x=>x[1]||'')}
function count(html,re){return (html.match(re)||[]).length}
function validMetaContent(value,min=1,max=500){const n=String(value||'').trim().length;return n>=min&&n<=max}
function absoluteOrToken(value){return /^https?:\/\/[^\s]+$/i.test(value)||/^__SITE_URL__/.test(value)}
function routeFromFile(file,root){const rel=path.relative(root,file).replaceAll(path.sep,'/');if(rel==='index.html')return '/app';if(rel==='landing.html')return '/';return '/'+rel.replace(/\.html$/,'');}
function parseJsonLd(html,file){const blocks=all(html,/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),parsed=[];for(const block of blocks){try{parsed.push(JSON.parse(block))}catch{parsed.push({__invalidJsonLd:true,file})}}return parsed}
function schemaTypes(value){const out=[];const walk=x=>{if(!x||typeof x!=='object')return;if(Array.isArray(x)){x.forEach(walk);return}if(typeof x['@type']==='string')out.push(x['@type']);if(Array.isArray(x['@type']))out.push(...x['@type']);if(x['@graph'])walk(x['@graph']);};walk(value);return [...new Set(out)]}
function sitemapUrls(root){const file=path.join(root,'sitemap.xml');if(!fs.existsSync(file))return {exists:false,urls:[],raw:''};const raw=fs.readFileSync(file,'utf8');return {exists:true,urls:all(raw,/<loc>([\s\S]*?)<\/loc>/gi).map(x=>x.trim()),raw};}

export function auditDiscoverability(root,{baseUrl='__SITE_URL__'}={}){
  const files=htmlFiles(root),issues=[],warnings=[],pages=[];
  const base=String(baseUrl||'__SITE_URL__').replace(/\/$/,'');
  if(!files.length)issues.push('No HTML pages found');

  for(const file of files){
    const html=fs.readFileSync(file,'utf8'),name=path.basename(file),route=routeFromFile(file,root);
    const title=first(html,/<title[^>]*>([^<]{3,120})<\/title>/i);
    const description=first(html,/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    const canonical=first(html,/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
    const robots=first(html,/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i);
    const og={title:first(html,/property=["']og:title["'][^>]+content=["']([^"']+)["']/i),description:first(html,/property=["']og:description["'][^>]+content=["']([^"']+)["']/i),url:first(html,/property=["']og:url["'][^>]+content=["']([^"']+)["']/i),image:first(html,/property=["']og:image["'][^>]+content=["']([^"']+)["']/i),imageAlt:first(html,/property=["']og:image:alt["'][^>]+content=["']([^"']+)["']/i)};
    const twitter={card:first(html,/name=["']twitter:card["'][^>]+content=["']([^"']+)["']/i),title:first(html,/name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i),description:first(html,/name=["']twitter:description["'][^>]+content=["']([^"']+)["']/i),image:first(html,/name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i),imageAlt:first(html,/name=["']twitter:image:alt["'][^>]+content=["']([^"']+)["']/i)};
    const jsonLd=parseJsonLd(html,name),types=[...new Set(jsonLd.flatMap(schemaTypes))];
    const internalLinks=all(html,/<a\b[^>]+href=["']([^"'#][^"']*)["']/gi).filter(h=>h.startsWith('/')&&!h.startsWith('//'));
    const images=all(html,/<img\b[^>]+>/gi),missingAlt=images.filter(tag=>!/\balt=["'][^"']*["']/i.test(tag)).length;
    const h1s=count(html,/<h1\b/gi),lang=/<html[^>]+lang=["'][^"']+["']/i.test(html),viewport=/<meta[^>]+name=["']viewport["']/i.test(html),main=/<main\b/i.test(html),keywords=/<meta[^>]+name=["']keywords["']/i.test(html),themeColor=/<meta[^>]+name=["']theme-color["']/i.test(html),manifest=/<link[^>]+rel=["']manifest["']/i.test(html),author=/<meta[^>]+name=["']author["']/i.test(html);
    const page={file:name,route,private:isPrivate,title:!!title,description:!!description,canonical:!!canonical,robots:!!robots,og:Object.values(og).every(Boolean),twitter:Object.values(twitter).every(Boolean),jsonLd:jsonLd.length>0&&jsonLd.every(x=>!x.__invalidJsonLd),schemaTypes:types,h1Count:h1s,internalLinks:internalLinks.length,images:images.length,missingAlt,lang,viewport,main,themeColor,manifest,author};
    pages.push(page);

    if(isPrivate){
      if(!/noindex/i.test(robots))issues.push(name+': private page is not noindex');
      continue;
    }
    if(!title||title.length<10||title.length>60)issues.push(name+': title must be 10-60 characters');
    if(!description||!validMetaContent(description,70,160))issues.push(name+': description must be 70-160 characters');
    if(!canonical||!absoluteOrToken(canonical))issues.push(name+': canonical must be absolute');
    if(!author)warnings.push(name+': missing author metadata');
    if(!themeColor)warnings.push(name+': missing theme-color metadata');
    if(!manifest)warnings.push(name+': missing web manifest link');
    if(h1s!==1)issues.push(name+': expected exactly one H1');
    if(!lang)issues.push(name+': missing html lang');
    if(!viewport)warnings.push(name+': missing viewport metadata');
    if(!main)warnings.push(name+': missing main landmark');
    if(keywords)warnings.push(name+': meta keywords is unnecessary');
    if(!page.jsonLd)issues.push(name+': missing or invalid JSON-LD');
    else if(!types.includes('WebPage')&&!types.includes('WebSite'))warnings.push(name+': JSON-LD lacks WebPage/WebSite');
    if(!page.og)warnings.push(name+': incomplete Open Graph metadata');
    if(!page.twitter)warnings.push(name+': incomplete Twitter metadata');
    if(og.image&&!og.imageAlt)warnings.push(name+': Open Graph image is missing alt text');
    if(twitter.image&&!twitter.imageAlt)warnings.push(name+': Twitter image is missing alt text');
    if(internalLinks.length<2)warnings.push(name+': weak crawlable internal linking');
    if(missingAlt)issues.push(name+': '+missingAlt+' image(s) missing alt text');
  }

  const publicPages=pages.filter(p=>!p.private),titles=publicPages.map(p=>p.title?first(fs.readFileSync(path.join(root,p.file),'utf8'),/<title[^>]*>([^<]+)<\/title>/i):p.file),descriptions=publicPages.map(p=>p.description?first(fs.readFileSync(path.join(root,p.file),'utf8'),/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i):p.file);
  if(new Set(titles).size!==titles.length)issues.push('Duplicate public page titles detected');
  if(new Set(descriptions).size!==descriptions.length)issues.push('Duplicate public meta descriptions detected');

  const robotsFile=path.join(root,'robots.txt');
  if(!fs.existsSync(robotsFile))issues.push('missing robots.txt');
  else{
    const robots=fs.readFileSync(robotsFile,'utf8');
    if(!/User-agent:\s*\*/i.test(robots))issues.push('robots.txt missing wildcard user-agent');
    if(!/Sitemap:\s*https?:\/\//i.test(robots)&&!/Sitemap:\s*__SITE_URL__/i.test(robots))issues.push('robots.txt sitemap is not absolute');
    if(!/Disallow:\s*\/api\//i.test(robots))warnings.push('robots.txt does not disallow /api/');
  }

  const sitemap=sitemapUrls(root);
  if(!sitemap.exists)issues.push('missing sitemap.xml');
  else{
    if(!/<urlset\b[^>]*>/i.test(sitemap.raw))issues.push('sitemap.xml is not a urlset');
    if(new Set(sitemap.urls).size!==sitemap.urls.length)issues.push('sitemap.xml contains duplicate URLs');
    if(sitemap.urls.some(u=>!/^(https?:\/\/|__SITE_URL__)/i.test(u)))issues.push('sitemap.xml contains non-absolute URLs');
    if(sitemap.urls.some(u=>/\/admin(?:\/|$)|\/login(?:\/|$)|\/api(?:\/|$)/i.test(u)))issues.push('sitemap.xml contains private/API URLs');
    for(const page of publicPages){if(!sitemap.urls.some(u=>u===base+page.route||u===base+'/'+page.route.replace(/^\//,'')))warnings.push('sitemap.xml missing '+page.route);}
  }

  const llmsPath=path.join(root,'llms.txt');
  if(!fs.existsSync(llmsPath))warnings.push('llms.txt is not present (optional supplemental AI discovery file; not required for Google Search)');
  else if(!/^#\s/m.test(fs.readFileSync(llmsPath,'utf8')))warnings.push('llms.txt is missing a title');
  const score=Math.max(0,100-Math.min(70,issues.length*8)-Math.min(30,warnings.length*2));
  const ok=issues.length===0;
  return {ok,score,grade:score>=95?'A+':score>=90?'A':score>=80?'B':score>=70?'C':score>=60?'D':'F',baseUrl:base,pages,issues,warnings,checkedAt:new Date().toISOString(),signals:{publicPages:publicPages.length,sitemapUrls:sitemap.urls.length}};
}
export function aeoSummary(audit){
  const publicPages=audit.pages.filter(p=>!p.private);
  const schemaReady=publicPages.every(p=>p.jsonLd&&p.schemaTypes.some(t=>['WebPage','WebSite','Organization','SoftwareApplication'].includes(t)));
  const contentReady=publicPages.every(p=>p.description&&p.h1Count===1&&p.internalLinks>=2&&p.main&&p.lang);
  return {score:audit.score,grade:audit.grade,ready:audit.ok,answerEngineReady:audit.ok&&schemaReady&&contentReady,issues:audit.issues.slice(0,30),warnings:audit.warnings.slice(0,30)};
}
