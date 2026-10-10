import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root=fs.mkdtempSync(path.join(os.tmpdir(),'build-vibe-server-'));
process.env.NODE_ENV='test';
process.env.DATABASE_PATH=path.join(root,'server.db');
process.env.CODINGVIBES_SESSION_SECRET='test-session-secret-'.padEnd(48,'x');
process.env.CODINGVIBES_PUBLIC_URL='http://127.0.0.1:0';
process.env.CODINGVIBES_ALLOWED_ORIGINS='http://127.0.0.1:0';
process.env.CODINGVIBES_ENFORCE_QUOTAS='false';
process.env.CODINGVIBES_BILLING_REQUIRED='false';

const {server}=await import('../src/server.js?route-smoke');
const {Store}=await import('../src/db/store.js');
const smokeStore=new Store(process.env.DATABASE_PATH);
let origin='';

async function req(path,options={}){
  const headers=new Headers(options.headers||{});
  if(options.body&&!headers.has('content-type'))headers.set('content-type','application/json');
  const response=await fetch(origin+path,{...options,headers});
  const text=await response.text();
  let body={};try{body=text?JSON.parse(text):{};}catch{body={text};}
  return {response,body};
}

test('server public and authenticated route smoke covers launch control plane',async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address=server.address();
  origin='http://127.0.0.1:'+address.port;
  process.env.CODINGVIBES_PUBLIC_URL=origin;
  process.env.CODINGVIBES_ALLOWED_ORIGINS=origin;

  for(const pathName of ['/health','/robots.txt','/sitemap.xml','/terms','/privacy','/api/auth/google/config','/api/templates','/api/builder/capabilities','/.well-known/codingvibes-ai.json']){
    const r=await req(pathName);
    assert.ok([200,404].includes(r.response.status),pathName+' status '+r.response.status);
  }

  const unauthToolCatalog=await req('/api/tool-fabric/catalog');
  assert.equal(unauthToolCatalog.response.status,401);

  const unauthToolPipeline=await req('/api/tool-fabric/pipeline',{method:'POST',body:JSON.stringify({steps:[{id:'format',tool:'json.format',input:{text:'{"ok":true}'}}]})});
  assert.equal(unauthToolPipeline.response.status,401);

  const signup=await req('/api/auth/signup',{method:'POST',body:JSON.stringify({email:'smoke@example.com',password:'test-password-123'})});
  assert.equal(signup.response.status,201);
  const cookie=signup.response.headers.get('set-cookie');
  assert.ok(cookie);
  const sessionCookie=cookie.split(';')[0];

  const authPaths=[
    '/api/auth/me','/api/billing','/api/features','/api/workspaces','/api/cloud/catalog','/api/connectors',
    '/api/ai/providers','/api/model/status','/api/projects','/api/builder/research','/api/launch/status',
    '/api/deployment/providers','/api/targets/availability','/api/targets','/api/integrations','/api/ai/settings',
    '/api/ai/tokens','/api/fleet','/api/tool-fabric/catalog'
  ];
  for(const p of authPaths){
    const r=await req(p,{headers:{cookie:sessionCookie}});
    assert.notEqual(r.response.status,500,p);
  }

  const catalog=await req('/api/tool-fabric/catalog',{headers:{cookie:sessionCookie}});
  assert.equal(catalog.response.status,200);
  assert.equal(catalog.body.tools.length,44);
  assert.ok(catalog.body.tools.some(tool=>tool.id==='seo.meta.generate'));
  assert.ok(catalog.body.tools.some(tool=>tool.id==='image.optimize'&&tool.executionMode==='browser'));

  const formatted=await req('/api/tool-fabric/execute',{method:'POST',headers:{cookie:sessionCookie},body:JSON.stringify({id:'json.format',input:{text:'{"ok":true}'}})});
  assert.equal(formatted.response.status,200);
  assert.equal(formatted.body.result.status,'COMPLETED');
  assert.equal(formatted.body.result.output.formatted,'{\n  "ok": true\n}');

  const blocked=await req('/api/tool-fabric/execute',{method:'POST',headers:{cookie:sessionCookie},body:JSON.stringify({id:'api.test',input:{url:'http://127.0.0.1:8080/admin',method:'GET'}})});
  assert.equal(blocked.response.status,200);
  assert.equal(blocked.body.result.status,'BLOCKED');
  assert.equal(blocked.body.result.networkUsed,false);

  const pipeline=await req('/api/tool-fabric/pipeline',{method:'POST',headers:{cookie:sessionCookie},body:JSON.stringify({steps:[
    {id:'format',tool:'json.format',input:{text:'{"ok":true}'}},
    {id:'types',tool:'json.typescript',input:{json:{$ref:'format.output.formatted'},rootName:'Smoke'}}
  ]})});
  assert.equal(pipeline.response.status,200);
  assert.equal(pipeline.body.result.status,'COMPLETED');
  assert.equal(pipeline.body.result.networkUsed,false);
  assert.equal(pipeline.body.result.stepCount,2);
  assert.match(pipeline.body.result.results[1].output.typescript,/interface Smoke/);

  const project=await req('/api/projects',{method:'POST',headers:{cookie:sessionCookie},body:JSON.stringify({name:'Smoke Product'})});
  assert.equal(project.response.status,201);
  const pid=project.body.project.id;
  const me=await req('/api/auth/me',{headers:{cookie:sessionCookie}});
  const userId=me.body.user?.id||me.body.id;
  assert.ok(userId,'authenticated user id should be available');
  const assetSession=smokeStore.createSession(userId,pid,'Image asset smoke');
  const assetRun=smokeStore.createRun(userId,assetSession.id,'optimized image upload smoke');
  const assetWorkspace=fs.mkdtempSync(path.join(root,'asset-workspace-'));
  smokeStore.updateRun(assetRun.id,userId,{workspace:assetWorkspace,status:'verified'});
  const pixelPng='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/s9sAAAAASUVORK5CYII=';
  const savedAsset=await req('/api/runs/'+assetRun.id+'/assets',{method:'POST',headers:{cookie:sessionCookie},body:JSON.stringify({fileName:'pixel.png',mimeType:'image/png',contentBase64:pixelPng})});
  assert.equal(savedAsset.response.status,201);
  assert.match(savedAsset.body.path,/^public\/assets\/[a-zA-Z0-9_-]+-[a-f0-9]{12}\.png$/);
  assert.deepEqual(fs.readFileSync(path.join(assetWorkspace,savedAsset.body.path)),Buffer.from(pixelPng,'base64'));
  assert.equal(smokeStore.getRun(assetRun.id,userId).status,'edited');
  assert.equal(smokeStore.listChangesets(assetRun.id).at(-1).status,'needs_verification');
  const badAsset=await req('/api/runs/'+assetRun.id+'/assets',{method:'POST',headers:{cookie:sessionCookie},body:JSON.stringify({fileName:'pixel.webp',mimeType:'image/webp',contentBase64:pixelPng})});
  assert.equal(badAsset.response.status,415);


  const projectPaths=[
    '/api/projects/'+pid+'/memory',
    '/api/projects/'+pid+'/design',
    '/api/projects/'+pid+'/domains',
    '/api/projects/'+pid+'/cloud-services',
    '/api/projects/'+pid+'/content/revisions',
    '/api/projects/'+pid+'/research',
    '/api/projects/'+pid+'/discoverability',
  ];
  for(const p of projectPaths){
    const r=await req(p,{headers:{cookie:sessionCookie}});
    assert.ok(r.response.status<500,p+' status '+r.response.status);
  }

  const blueprint=await req('/api/builder/blueprint',{method:'POST',headers:{cookie:sessionCookie},body:JSON.stringify({request:'Build a responsive landing page for a small SaaS product with SEO metadata.'})});
  assert.equal(blueprint.response.status,200);
  const analytics=await req('/api/analytics/events',{method:'POST',headers:{cookie:sessionCookie},body:JSON.stringify({event:'route-smoke',properties:{source:'ci'}})});
  assert.ok(analytics.response.status<500);
  const featureEval=await req('/api/feature-flags/evaluate',{method:'POST',headers:{cookie:sessionCookie},body:JSON.stringify({key:'route-smoke'})});
  assert.ok(featureEval.response.status<500);
  const connectorTest=await req('/api/connectors/test',{method:'POST',headers:{cookie:sessionCookie},body:JSON.stringify({id:'missing'})});
  assert.ok(connectorTest.response.status<500);
  const integrationTest=await req('/api/integrations/test',{method:'POST',headers:{cookie:sessionCookie},body:JSON.stringify({id:'missing'})});
  assert.ok(integrationTest.response.status<500);
  const setMemory=await req('/api/projects/'+pid+'/memory',{method:'PUT',headers:{cookie:sessionCookie},body:JSON.stringify({memory:{brand:'Smoke',preferences:['safe','fast']}})});
  assert.equal(setMemory.response.status,200);
  const revision=await req('/api/projects/'+pid+'/content/revisions',{method:'POST',headers:{cookie:sessionCookie},body:JSON.stringify({status:'draft'})});
  assert.equal(revision.response.status,201);
  const domain=await req('/api/projects/'+pid+'/domains',{method:'POST',headers:{cookie:sessionCookie},body:JSON.stringify({domain:'example.com',provider:'cloudflare'})});
  assert.equal(domain.response.status,201);
  const service=await req('/api/projects/'+pid+'/cloud-services',{method:'POST',headers:{cookie:sessionCookie},body:JSON.stringify({type:'database'})});
  assert.ok(service.response.status<500);

  const csrf=await req('/api/projects',{method:'POST',headers:{'sec-fetch-site':'cross-site'},body:JSON.stringify({name:'Blocked'})});
  assert.equal(csrf.response.status,403);
});

test.after(async()=>{
  await new Promise(resolve=>server.close(resolve));
  smokeStore.close();
  fs.rmSync(root,{recursive:true,force:true});
});
