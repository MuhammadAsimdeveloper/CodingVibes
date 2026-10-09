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
process.env.CODINGVIBES_OBJECT_BACKEND='local';
process.env.CODINGVIBES_OBJECT_ROOT=path.join(root,'objects');

const {server}=await import('../src/server.js?route-smoke');
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

  const signup=await req('/api/auth/signup',{method:'POST',body:JSON.stringify({email:'smoke@example.com',password:'test-password-123'})});
  assert.equal(signup.response.status,201);
  const cookie=signup.response.headers.get('set-cookie');
  assert.ok(cookie);
  const sessionCookie=cookie.split(';')[0];

  const authPaths=[
    '/api/auth/me','/api/billing','/api/features','/api/workspaces','/api/cloud/catalog','/api/connectors',
    '/api/ai/providers','/api/model/status','/api/projects','/api/builder/research','/api/launch/status',
    '/api/deployment/providers','/api/targets/availability','/api/targets','/api/integrations','/api/ai/settings',
    '/api/ai/tokens','/api/fleet'
  ];
  for(const p of authPaths){
    const r=await req(p,{headers:{cookie:sessionCookie}});
    assert.notEqual(r.response.status,500,p);
  }

  const project=await req('/api/projects',{method:'POST',headers:{cookie:sessionCookie},body:JSON.stringify({name:'Smoke Product'})});
  assert.equal(project.response.status,201);
  const pid=project.body.project.id;

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

  const scenePath='/api/projects/'+pid+'/scene';
  const unauthenticatedScene=await req(scenePath);
  assert.equal(unauthenticatedScene.response.status,401);

  const emptyScene=await req(scenePath,{headers:{cookie:sessionCookie}});
  assert.equal(emptyScene.response.status,200);
  assert.equal(emptyScene.body.scene,null);
  assert.equal(emptyScene.body.revision,0);

  const scene={
    schemaVersion:1,
    id:'route-smoke-scene',
    name:'Route smoke scene',
    nodes:[{id:'hero',type:'box',name:'Hero',color:'#8b7dff',visible:true,position:[0,1,0]}]
  };
  const invalidScene=await req(scenePath,{method:'PUT',headers:{cookie:sessionCookie},body:JSON.stringify({scene:{schemaVersion:1,id:'invalid',name:'Invalid',nodes:[{id:'bad',type:'unknown'}]},expectedRevision:0})});
  assert.equal(invalidScene.response.status,400);
  assert.equal(invalidScene.body.error,'invalid_scene_document');

  const missingRevision=await req(scenePath,{method:'PUT',headers:{cookie:sessionCookie},body:JSON.stringify({scene})});
  assert.equal(missingRevision.response.status,400);
  assert.equal(missingRevision.body.error,'expected_revision_must_be_nonnegative_integer');

  const sceneSave=await req(scenePath,{method:'PUT',headers:{cookie:sessionCookie},body:JSON.stringify({scene,expectedRevision:0})});
  assert.equal(sceneSave.response.status,200);
  assert.equal(sceneSave.body.revision,1);
  assert.equal(sceneSave.body.scene.nodes[0].id,'hero');

  const loadedScene=await req(scenePath,{headers:{cookie:sessionCookie}});
  assert.equal(loadedScene.response.status,200);
  assert.equal(loadedScene.body.revision,1);
  assert.equal(loadedScene.body.scene.nodes[0].color,'#8b7dff');

  const staleScene=structuredClone(scene);
  staleScene.nodes[0].color='#ff0000';
  const staleSave=await req(scenePath,{method:'PUT',headers:{cookie:sessionCookie},body:JSON.stringify({scene:staleScene,expectedRevision:0})});
  assert.equal(staleSave.response.status,409);
  assert.equal(staleSave.body.error,'scene_revision_conflict');
  assert.equal(staleSave.body.currentRevision,1);

  const sceneAfterConflict=await req(scenePath,{headers:{cookie:sessionCookie}});
  assert.equal(sceneAfterConflict.body.scene.nodes[0].color,'#8b7dff');

  const ephemeralScene=structuredClone(scene);ephemeralScene.nodes[0].type='image';ephemeralScene.nodes[0].assetUrl='blob:http://localhost/session-only';
  const ephemeralSave=await req(scenePath,{method:'PUT',headers:{cookie:sessionCookie},body:JSON.stringify({scene:ephemeralScene,expectedRevision:1})});
  assert.equal(ephemeralSave.response.status,400);
  assert.equal(ephemeralSave.body.error,'temporary_scene_asset_must_be_uploaded');

  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j5ZsAAAAASUVORK5CYII=','base64');
  const upload=await req('/api/projects/'+pid+'/assets',{method:'POST',headers:{cookie:sessionCookie,'content-type':'image/png','x-asset-name':encodeURIComponent('hero.png'),'x-asset-role':'texture'},body:png});
  assert.equal(upload.response.status,201,JSON.stringify(upload.body));
  const asset=upload.body.asset;
  assert.ok(asset.publicPath.startsWith('/assets/'));
  assert.equal(asset.size,png.length);
  assert.equal(asset.sha256.length,64);
  assert.equal(asset.metadata.storage.provider,'local');
  assert.ok(asset.metadata.storage.key.includes(pid));
  const assets=await req('/api/projects/'+pid+'/assets',{headers:{cookie:sessionCookie}});
  assert.equal(assets.response.status,200);
  assert.ok(assets.body.assets.some(row=>row.id===asset.id));
  const preview=await fetch(origin+'/api/projects/'+pid+'/assets/'+asset.id+'/preview',{headers:{cookie:sessionCookie}});
  assert.equal(preview.status,200);
  assert.equal(preview.headers.get('content-type'),'image/png');
  assert.equal((await preview.arrayBuffer()).byteLength,png.length);
  const corrupt=await req('/api/projects/'+pid+'/assets',{method:'POST',headers:{cookie:sessionCookie,'content-type':'image/png','x-asset-name':'fake.png'},body:Buffer.from('<html>not an image</html>')});
  assert.equal(corrupt.response.status,400);
  assert.equal(corrupt.body.error,'asset_content_mismatch');
  const deleteAsset=await req('/api/projects/'+pid+'/assets/'+asset.id,{method:'DELETE',headers:{cookie:sessionCookie}});
  assert.equal(deleteAsset.response.status,200);
  const assetsAfterDelete=await req('/api/projects/'+pid+'/assets',{headers:{cookie:sessionCookie}});
  assert.equal(assetsAfterDelete.body.assets.some(row=>row.id===asset.id),false);

  const designEdit=await req('/api/projects/'+pid+'/design/intent',{method:'POST',headers:{cookie:sessionCookie},body:JSON.stringify({request:'make the heading blue, bigger, centered and bold'})});
  assert.equal(designEdit.response.status,200);
  assert.ok(designEdit.body.applied.length>=4);
  assert.equal(designEdit.body.designSystem.system.visualEdits.length,designEdit.body.applied.length);
  assert.match(designEdit.body.message,/next build|Rebuild/i);
  const unsupportedEdit=await req('/api/projects/'+pid+'/design/intent',{method:'POST',headers:{cookie:sessionCookie},body:JSON.stringify({request:'write a newsletter'})});
  assert.equal(unsupportedEdit.response.status,422);
  const savedDesign=await req('/api/projects/'+pid+'/design',{headers:{cookie:sessionCookie}});
  assert.equal(savedDesign.response.status,200);
  assert.ok(savedDesign.body.designSystem.system.visualEdits.length>0);

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
  fs.rmSync(root,{recursive:true,force:true});
});
