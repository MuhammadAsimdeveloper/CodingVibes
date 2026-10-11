import fs from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {Store} from '../src/db/store.js';
import {planCatalog,canStartRun} from '../src/billing/plans.js';
import {verifyStripeSignature} from '../src/billing/stripe.js';
import {readiness} from '../src/ops/readiness.js';

test('billing defaults to free and exposes configured plan catalog',()=>{
 const dir=mkdtempSync(path.join(os.tmpdir(),'cv-billing-'));const db=path.join(dir,'x.db');const store=new Store(db);const u=store.createUser('billing@example.com','hash');const b=store.getBilling(u.id);assert.equal(b.plan,'free');assert.ok(planCatalog({STRIPE_PRICE_PRO_MONTHLY:'price_x'}).find(x=>x.id==='pro').stripePriceConfigured);const usage=store.monthlyUsage(u.id,'2999-01');assert.deepEqual(usage,{period:'2999-01',runs:0,tokens:0});assert.equal(canStartRun({plan:'free',runs:0,tokens:0}).ok,true);store.close();
});

test('stripe signatures verify with timestamped payloads',async()=>{
 const raw='{"id":"evt_test"}',secret='whsec_test';const ts=Math.floor(Date.now()/1000);const crypto=await import('node:crypto');const sig=crypto.createHmac('sha256',secret).update(`${ts}.${raw}`).digest('hex');assert.equal(verifyStripeSignature(raw,`t=${ts},v1=${sig}`,secret),true);assert.equal(verifyStripeSignature(raw,`t=${ts-9999},v1=${sig}`,secret),false);
});

test('readiness reports production blockers without secrets',()=>{
 const previous={...process.env};try{process.env.NODE_ENV='production';delete process.env.CODINGVIBES_SESSION_SECRET;delete process.env.DAYTONA_API_KEY;delete process.env.CODINGVIBES_ENFORCE_QUOTAS;const r=readiness({router:{getStatus:()=>({configured:false,provider:'openai'})}});assert.equal(r.ready,false);assert.ok(r.blockers.includes('session_secret_too_short'));assert.ok(r.blockers.includes('daytona_api_key_missing'));assert.ok(r.blockers.includes('quota_enforcement_not_enabled'));}finally{for(const k of Object.keys(process.env))if(!(k in previous))delete process.env[k];for(const [k,v] of Object.entries(previous))process.env[k]=v;}
});


test('production readiness blocks explicitly disabled structured access logs',()=>{
 const previous={...process.env};
 try{
  process.env.NODE_ENV='production';
  process.env.CODINGVIBES_STRUCTURED_ACCESS_LOGS='false';
  const result=readiness({router:{getStatus:()=>({configured:true,provider:'fixture'})}});
  assert.ok(result.blockers.includes('structured_access_logs_disabled'));
 }finally{
  for(const key of Object.keys(process.env))if(!(key in previous))delete process.env[key];
  for(const [key,value] of Object.entries(previous))process.env[key]=value;
 }
});

test('hostinger assisted deployment reuses the connected GitHub credential and records the next step',async()=>{
 const index=await import('../src/deployment/index.js?hostinger-test');
 assert.equal(typeof index.providerSecret,'function');
 const provider=await import('../src/deployment/providers.js?hostinger-test');
 assert.equal(provider.PROVIDERS.hostinger.label,'Hostinger');
 assert.equal(provider.PROVIDERS.hostinger.supports.server,true);
 assert.equal(provider.PROVIDERS.hostinger.auth,'github');
});

test('production preflight script is wired into package scripts',async()=>{
 const pkg=JSON.parse(await (await import('node:fs/promises')).readFile('package.json','utf8'));
 assert.equal(pkg.scripts['launch:preflight'],'node scripts/production-preflight.mjs');
});

test('billing helper maps Stripe price IDs to configured plans',async()=>{const x=await import('../src/billing/stripe.js');assert.equal(x.planFromStripePrice('p',{STRIPE_PRICE_PRO_MONTHLY:'p'}),'pro');assert.equal(x.planFromStripePrice('t',{STRIPE_PRICE_TEAM_MONTHLY:'t'}),'team');assert.equal(x.planFromStripePrice('x',{STRIPE_PRICE_PRO_MONTHLY:'p'}),null);});

test('target execution availability is classified',async()=>{const {targetExecutionAvailability}=await import('../src/targets/verify.js');const {getTarget}=await import('../src/targets/registry.js');const r=targetExecutionAvailability(getTarget('web-node'));assert.equal(r.canBuild,true);assert.equal(typeof r.host.available,'boolean');});

test('launch center surfaces exist',async()=>{const f=await (await import('node:fs/promises')).readFile('src/server.js','utf8');assert.ok(f.includes('/api/launch/status'));assert.ok(f.includes('/api/billing/webhook'));assert.ok(f.includes('/api/targets/availability'));assert.ok(f.includes('/api/deployment/providers/'));assert.ok(f.includes('authenticateProvider({store,userId,provider})'));});


test('production readiness forbids host-local execution and requires an explicit container image',()=>{
 const previous={...process.env};
 try{
  process.env.NODE_ENV='production';
  process.env.CODINGVIBES_SESSION_SECRET='x'.repeat(64);
  process.env.CODINGVIBES_ENFORCE_QUOTAS='true';
  process.env.CODINGVIBES_ENABLE_BROWSER='true';
  process.env.CODINGVIBES_PUBLIC_URL='https://example.com';
  process.env.CODINGVIBES_SUPERADMIN_EMAILS='ops@example.com';
  process.env.CODINGVIBES_PROJECT_ROOT='/tmp/cv-readiness-projects';
  process.env.CODINGVIBES_WORK_ROOT='/tmp/cv-readiness-work';
  process.env.CODINGVIBES_CHECKPOINT_ROOT='/tmp/cv-readiness-checkpoints';
  process.env.CODINGVIBES_BACKUP_ROOT='/tmp/cv-readiness-backups';
  process.env.CODINGVIBES_RUNTIME='local';
  const local=readiness({router:{getStatus:()=>({configured:true,provider:'openai'})}});
  assert.ok(local.blockers.includes('host_execution_forbidden_in_production'));
  process.env.CODINGVIBES_RUNTIME='container';
  delete process.env.CODINGVIBES_CONTAINER_IMAGE;
  const container=readiness({router:{getStatus:()=>({configured:true,provider:'openai'})}});
  assert.ok(container.blockers.includes('container_image_required'));
 } finally {
  for(const k of Object.keys(process.env))if(!(k in previous))delete process.env[k];
  for(const [k,v] of Object.entries(previous))process.env[k]=v;
 }
});

test('launch telemetry is bounded and excludes credentials',async()=>{
 const {RequestTelemetry}=await import('../src/ops/telemetry.js?telemetry-test');
 const t=new RequestTelemetry({maxRoutes:2});
 t.record({method:'GET',path:'/api/a',status:200,durationMs:10});
 t.record({method:'POST',path:'/api/a',status:500,durationMs:20});
 t.record({method:'GET',path:'/api/b',status:404,durationMs:30});
 t.record({method:'GET',path:'/api/c?token=secret',status:200,durationMs:40});
 const s=t.snapshot();
 assert.equal(s.requests.total,4);
 assert.equal(s.requests.errors,1);
 assert.ok(s.routes.length<=2);
 assert.equal(JSON.stringify(s).includes('secret'),false);
});

test('server exposes a request id and protected launch status surface',()=>{
 const source=fs.readFileSync('src/server.js','utf8');
 assert.match(source,/x-request-id/);
 assert.match(source,/\/api\/launch\/status/);
 assert.match(source,/\/api\/ops\/metrics/);
 assert.match(source,/telemetry\.snapshot\(\)/);
});
test('final release contract is checked into the repository',()=>{
 assert.ok(fs.existsSync('docs/FINAL_RELEASE_12.1.md'));
 const workflow=fs.readFileSync('.github/workflows/runner-fleet-smoke.yml','utf8');
 assert.match(workflow,/actions\/checkout@v7/);
 assert.match(workflow,/actions\/upload-artifact@v7/);
 assert.match(workflow,/actions\/download-artifact@v8/);
 assert.match(workflow,/timeout-minutes:/);
});

test('readiness reports Google OAuth as an explicit optional warning when unconfigured',()=>{
 const previous={...process.env};
 try{
  process.env.NODE_ENV='development';
  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;
  delete process.env.GOOGLE_REDIRECT_URI;
  const r=readiness({router:{getStatus:()=>({configured:false,provider:'openai'})}});
  assert.ok(r.warnings.includes('google_oauth_not_configured'));
  assert.equal(r.blockers.includes('google_oauth_not_configured'),false);
 } finally {
  for(const k of Object.keys(process.env))if(!(k in previous))delete process.env[k];
  for(const [k,v] of Object.entries(previous))process.env[k]=v;
 }
});
