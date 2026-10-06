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
    '/api/ai/providers','/api/model/status','/api/projects','/api/builder/research'
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
