import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('public liveness is minimal and sensitive readiness is not exposed in production',()=>{
  const source=fs.readFileSync('src/server.js','utf8');
  assert.match(source,/u\.pathname==='\/health'.*?service:'build-vibe',/s);
  assert.doesNotMatch(source,/u\.pathname==='\/health'.*?model:router\.getStatus/s);
  assert.match(source,/NODE_ENV==='production'&&\!r\.ready\)return sendJson\(res,503,\{ok:false,ready:false,service:'build-vibe',status:'not_ready'\}/);
});

test('proxy trust and auth throttling are explicit',()=>{
  const source=fs.readFileSync('src/server.js','utf8');
  assert.match(source,/CODINGVIBES_TRUST_PROXY/);
  assert.match(source,/authRateLimit\(req,'signup'\)/);
  assert.match(source,/authRateLimit\(req,'login'\)/);
  assert.match(source,/strict-transport-security/);
});

test('billing has a single canonical Stripe webhook route',()=>{
  const source=fs.readFileSync('src/server.js','utf8');
  assert.equal((source.match(/u\.pathname==='\/api\/billing\/webhook'/g)||[]).length,1);
  assert.equal(source.includes("/api/webhooks/stripe"),false);
});

test('public legal and security files are present and static routing is wired',()=>{
  assert.ok(fs.existsSync('public/terms.html'));
  assert.ok(fs.existsSync('public/privacy.html'));
  assert.ok(fs.existsSync('public/.well-known/security.txt'));
  const source=fs.readFileSync('src/server.js','utf8');
  assert.match(source,/pathname==='\/terms'/);
  assert.match(source,/pathname==='\/privacy'/);
  assert.match(source,/'.txt':'text\/plain/);
  for(const file of ['public/terms.html','public/privacy.html']) assert.doesNotMatch(fs.readFileSync(file,'utf8'),/\sstyle\s*=/i);
});

test('landing claims are aligned with the implemented 61-template catalog',()=>{
  const landing=fs.readFileSync('public/landing.html','utf8');
  assert.match(landing,/60\+ Curated/);
  assert.match(landing,/60\+ Templates/);
  assert.match(landing,/Visual Editing/);
  assert.match(landing,/Verified Build Loop/);
  for(const claim of ['100,000+','100+ Modern','No Code • No Limits','24/7 Support','Drag &amp; Drop']) assert.equal(landing.includes(claim),false,claim);
});

test('release hardening artifacts and CI gate exist',()=>{
  assert.ok(fs.existsSync('docs/COMPETITIVE_POSITIONING.md'));
  assert.ok(fs.existsSync('docs/LAUNCH_AUDIT_2026-10-04.md'));
  assert.ok(fs.existsSync('scripts/security-preflight.mjs'));
  const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
  assert.equal(pkg.scripts['security:check'],'node scripts/security-preflight.mjs');
  const ci=fs.readFileSync('.github/workflows/ci.yml','utf8');
  assert.match(ci,/npm run security:check/);
});
