import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {getTemplate,searchTemplates} from '../src/templates/catalog.js';
import {analyzeRequirements} from '../src/agent/requirements.js';
import {createDefaultSiteContent,normalizeSiteContent,applyContentOperation,contentSchema} from '../src/site/content.js';
import {generateProject,materializeProject} from '../src/agent/project-generator.js';
import {Store} from '../src/db/store.js';

test('v6 template catalog covers major site families and immersive variants',()=>{
  const templates=searchTemplates('');
  assert.ok(templates.length>=45);
  for(const id of ['shopify-minimal','shopify-streetwear-3d','portfolio-3d','consulting-business','property-3d-developer','restaurant-3d','marketplace-3d','saas-product-3d'])assert.ok(getTemplate(id),id);
  assert.equal(getTemplate('shopify-streetwear-3d').kind,'ecommerce');
  assert.equal(getTemplate('shopify-streetwear-3d').experience,'3d');
  assert.equal(getTemplate('shopify-minimal').tier,'free');
});

test('site kit inference creates rich commerce content contract',()=>{
  const spec=analyzeRequirements('Create a Shopify-style ecommerce store for sneakers with collections, product variants, inventory, cart, checkout, search, wishlist and SEO.');
  assert.equal(spec.siteKind,'ecommerce');
  assert.equal(spec.appType,'commerce');
  assert.equal(spec.behavior.catalog,true);
  assert.equal(spec.behavior.cart,true);
  assert.ok(spec.contentModel.collections.includes('products'));
  assert.ok(spec.pages.includes('/shop'));
  assert.ok(spec.dataModel.some(x=>x.name==='products'));
});

test('content operations preserve IDs and support add update delete reorder',()=>{
  let content=createDefaultSiteContent({kind:'ecommerce',templateId:'shopify-minimal'});
  const seed=content.products[0].id;
  content=applyContentOperation(content,{type:'add',collection:'products',record:{title:'Blue Sneaker',price:129,sku:'BLUE-1',inventory:9}});
  const added=content.products.find(x=>x.title==='Blue Sneaker');
  assert.ok(added?.id);
  content=applyContentOperation(content,{type:'update',collection:'products',id:added.id,patch:{price:139,inventory:7}});
  assert.equal(content.products.find(x=>x.id===added.id).price,139);
  const ids=content.products.map(x=>x.id).reverse();
  content=applyContentOperation(content,{type:'reorder',collection:'products',ids});
  assert.equal(content.products[0].id,added.id===seed?content.products[0].id:ids[0]);
  content=applyContentOperation(content,{type:'delete',collection:'products',id:added.id});
  assert.equal(content.products.some(x=>x.id===added.id),false);
  assert.ok(content.products.some(x=>x.id===seed));
  assert.ok(contentSchema('ecommerce').commerceProductFields.includes('variants'));
});

test('project content persists per user and project',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cv-content-'));
  const file=path.join(dir,'codingvibes.db');const store=new Store(file);
  const user=store.createUser('content-test@example.com','hash');const project=store.createProject(user.id,{name:'Catalog'});
  const input=normalizeSiteContent({kit:'ecommerce',products:[{title:'Desk Lamp',price:40,inventory:12}]},'ecommerce');
  input.meta.managed=true;
  store.upsertProjectContent(project.id,user.id,input);
  const saved=store.getProjectContent(project.id,user.id);
  assert.equal(saved.kit,'ecommerce');assert.equal(saved.products[0].title,'Desk Lamp');assert.equal(saved.meta.managed,true);store.close();
});

test('deterministic ecommerce projects are fully content-driven and runnable',async()=>{
  const spec=analyzeRequirements('Build a Shopify ecommerce store with products, collections, variants, cart and animated 3D product showcase.');
  const plan=generateProject(spec);
  const paths=new Set(plan.files.map(x=>x.path));
  assert.ok(paths.has('public/content/site.json'));
  assert.ok(paths.has('public/content-runtime.js'));
  const home=plan.files.find(x=>x.path==='public/index.html');
  assert.match(home.content,/data-product-grid/);
  assert.match(home.content,/content-runtime\.js/);
  const runtime=plan.files.find(x=>x.path==='public/content-runtime.js');
  assert.match(runtime.content,/data-add-to-cart/);
  assert.match(runtime.content,/localStorage/);
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cv-generated-'));materializeProject(plan,dir);
  const server=path.join(dir,'app','server.js');const site=path.join(dir,'public','content','site.json');
  assert.ok(fs.existsSync(server)&&fs.existsSync(site));
  const {spawn}=await import('node:child_process');const proc=spawn(process.execPath,[server],{env:{...process.env,HOST:'127.0.0.1',PORT:'4397'},stdio:'ignore'});
  try{for(let i=0;i<80;i++){try{const r=await fetch('http://127.0.0.1:4397/content/site.json');if(r.ok){const j=await r.json();assert.equal(j.version,'1.0');break;}}catch{}await new Promise(r=>setTimeout(r,50));}const health=await fetch('http://127.0.0.1:4397/api/health');assert.equal(health.status,200);}finally{if(proc.exitCode===null)proc.kill('SIGTERM');}
});
