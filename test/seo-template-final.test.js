import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {generateProject} from '../src/agent/project-generator.js';
import {listTemplates} from '../src/templates/catalog.js';
import {listPublicSeoPages,renderPublicSeoPage} from '../src/seo/public-pages.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('public landing page has complete organic-search metadata',()=>{
  const html=read('public/landing.html');
  assert.match(html,/<title>Build Vibe — AI Product Builder<\/title>/);
  assert.match(html,/<meta name="description" content="[^"]{80,}">/);
  assert.match(html,/<meta name="robots" content="index,follow,max-image-preview:large/);
  assert.match(html,/<link rel="canonical" href="__SITE_URL__\/">/);
  assert.match(html,/__SITE_URL__\/og-image\.svg/);
  assert.match(html,/__SITE_URL__\/og-image\.svg/);
  assert.match(html,/name="twitter:image" content="__SITE_URL__\/og-image\.svg"/);
  assert.match(html,/<script type="application\/ld\+json">/);
  assert.match(html,/Organization/);
  assert.match(html,/SoftwareApplication/);
  assert.doesNotMatch(html,/<meta[^>]+name="keywords"/i);
  assert.match(html,/\/favicon\.svg/);
  assert.match(html,/\/site\.webmanifest/);
  for(const href of ['/features','/templates','/pricing','/how-it-works','/ai-website-builder','/ai-app-builder'])assert.match(html,new RegExp('href="'+href.replaceAll('/','\\/')+'"'));
});

test('public SEO content pages have unique search metadata and crawl paths',()=>{const pages=listPublicSeoPages();const titles=new Set(),descriptions=new Set();assert.equal(pages.length,11);for(const page of pages){assert.ok(!titles.has(page.title),page.path);titles.add(page.title);assert.ok(!descriptions.has(page.description),page.path);descriptions.add(page.description);const html=renderPublicSeoPage(page.path);assert.match(html,/rel="canonical" href="__SITE_URL__\//);assert.match(html,/name="robots" content="index,follow,max-image-preview:large/);assert.match(html,/<h1>/);assert.match(html,/application\/ld\+json/)}assert.equal(pages.find(x=>x.path==='/faq').faqs.length,7)});

test('authenticated builder stays out of search',()=>{
  const html=read('public/index.html');
  assert.match(html,/<meta name="robots" content="noindex,nofollow,noarchive">/);
  assert.match(html,/Build <span>Vibe<\/span>/);
  assert.doesNotMatch(html,/codingVibes/);
});

test('generated projects emit canonical-ready structured SEO assets',()=>{
  const spec={
    request:'Build a boutique ecommerce storefront with products and owner admin portal',
    siteKind:'ecommerce',
    siteTemplateLabel:'Boutique Commerce',
    siteDescription:'A boutique storefront with searchable products and an owner-managed catalog.',
    pages:['/','/shop','/about'],
    apis:[],
    components:['product catalog','cart','admin portal'],
    dataModel:[{name:'products'}],
    behavior:{search:false,payments:false,publicLogin:false},
    styling:{visual:{threeD:false}},
    experience:{threeD:false}
  };
  const plan=generateProject(spec);
  const home=plan.files.find(x=>x.path==='public/index.html')?.content||'';
  const sitemap=plan.files.find(x=>x.path==='public/sitemap.xml')?.content||'';
  const manifest=plan.files.find(x=>x.path==='public/manifest.webmanifest')?.content||'';
  const server=plan.files.find(x=>x.path==='app/server.js')?.content||'';
  assert.match(home,/__SITE_URL__\//);
  assert.match(home,/application\/ld\+json/);
  assert.match(home,/BreadcrumbList/);
  assert.match(home,/WebPage/);
  assert.match(home,/max-image-preview:large/);
  assert.match(home,/\/favicon\.svg/);
  assert.match(home,/\/og-default\.svg/);
  assert.match(sitemap,/__SITE_URL__\/shop/);
  assert.match(manifest,/favicon\.svg/);
  assert.match(server,/u\.pathname==='\/sitemap\.xml'/);
  assert.match(server,/u\.pathname==='\/robots\.txt'/);
  assert.match(server,/replaceAll\('__SITE_URL__'/);
  assert.match(server,/applyContentSeo/);
});

test('template catalog contains unique ids and the final additions',()=>{
  const templates=listTemplates();
  const ids=templates.map(t=>t.id);
  assert.equal(new Set(ids).size,ids.length);
  for(const id of ['job-board','business-directory','appointment-booking','membership-community','docs-knowledge-base','operations-dashboard','subscription-commerce','real-estate-rentals']) assert.ok(ids.includes(id),id);
  assert.ok(templates.length>=50);
});

test('generated owner SEO fields are applied to rendered public HTML',async()=>{
  const spec={request:'Create a boutique consulting website',siteKind:'business',siteTemplateLabel:'Northstar Consulting',siteDescription:'Independent strategy and operations consulting for growing companies.',pages:['/','/services','/about'],apis:[],components:['services','team','contact'],dataModel:[{name:'services'}],behavior:{adminPortal:true,ownerOnlyAdmin:true,publicLogin:false,search:false,payments:false},styling:{visual:{threeD:false}},experience:{threeD:false}};
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cv-seo-runtime-'));
  const plan=generateProject(spec);
  for(const file of plan.files){const target=path.join(dir,file.path);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,file.content);}
  const contentFile=path.join(dir,'public','content','site.json');const content=JSON.parse(fs.readFileSync(contentFile,'utf8'));content.seo={title:'Northstar Consulting | Strategy Services',description:'Independent strategy and operations consulting for SaaS companies, professional services teams and growing businesses.',image:'/og-default.svg',canonical:'/services'};content.brand.name='Northstar Consulting';fs.writeFileSync(contentFile,JSON.stringify(content,null,2)+'\\n');
  const port=4510+Math.floor(Math.random()*30);const child=spawn(process.execPath,['app/server.js'],{cwd:dir,env:{...process.env,HOST:'127.0.0.1',PORT:String(port),CV_SESSION_SECRET:'01234567890123456789012345678901'},stdio:'ignore'});
  try{for(let i=0;i<100;i++){try{const health=await fetch('http://127.0.0.1:'+port+'/api/health');if(health.ok)break}catch{}await new Promise(r=>setTimeout(r,25));}
    const res=await fetch('http://127.0.0.1:'+port+'/');assert.equal(res.status,200);const html=await res.text();assert.match(html,/<title>Northstar Consulting \| Strategy Services<\/title>/);assert.match(html,/content="Independent strategy and operations consulting for SaaS companies, professional services teams and growing businesses\."/);assert.match(html,/rel="canonical" href="http:\/\/127\.0\.0\.1:\d+\/services"/);assert.match(html,/property="og:url" content="http:\/\/127\.0\.0\.1:\d+\/services"/);assert.match(html,/property="og:image" content="http:\/\/127\.0\.0\.1:\d+\/og-default\.svg"/);
  }finally{if(child.exitCode===null){child.kill('SIGTERM');await new Promise(resolve=>child.once('exit',resolve));}fs.rmSync(dir,{recursive:true,force:true});}
});
