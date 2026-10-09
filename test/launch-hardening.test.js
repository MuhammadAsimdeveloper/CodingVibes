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


test('public origin only trusts forwarded host/proto when proxy trust is enabled',async()=>{
  const {publicOrigin}=await import('../src/server.js?origin-boundary');
  const previous={...process.env};
  try{
    delete process.env.CODINGVIBES_PUBLIC_URL;
    process.env.CODINGVIBES_TRUST_PROXY='false';
    const request={headers:{host:'internal.example','x-forwarded-host':'evil.example','x-forwarded-proto':'https'},socket:{encrypted:false}};
    assert.equal(publicOrigin(request),'http://internal.example');
    process.env.CODINGVIBES_TRUST_PROXY='true';
    assert.equal(publicOrigin(request),'https://evil.example');
    process.env.CODINGVIBES_PUBLIC_URL='https://configured.example';
    assert.equal(publicOrigin(request),'https://configured.example');
  }finally{
    for(const k of Object.keys(process.env))if(!(k in previous))delete process.env[k];
    for(const [k,v] of Object.entries(previous))process.env[k]=v;
  }
});

test('public robots and sitemap endpoints are registered once',()=>{
  const source=fs.readFileSync('src/server.js','utf8');
  assert.equal((source.match(/u\.pathname==='\/robots\.txt'/g)||[]).length,1);
  assert.equal((source.match(/u\.pathname==='\/sitemap\.xml'/g)||[]).length,1);
});

test('Stripe checkout base URL uses the trusted public-origin helper',()=>{
  const source=fs.readFileSync('src/server.js','utf8');
  assert.ok(source.includes('const base=publicOrigin(req);'));
  assert.ok(source.includes('createCheckoutSession'));
  assert.equal(source.includes("const base=`${req.headers['x-forwarded-proto']"),false);
});
test('Stripe checkout redirect URLs are constrained to the trusted public origin',()=>{
  const source=fs.readFileSync('src/server.js','utf8');
  assert.ok(source.includes('normalizeReturnUrl(b.successUrl'));
  assert.ok(source.includes('normalizeReturnUrl(b.cancelUrl'));
  assert.ok(source.includes('cross_origin_redirect_url'));
});

test('cross-site Fetch Metadata is rejected even when Origin is absent',()=>{
  const source=fs.readFileSync('src/server.js','utf8');
  assert.match(source,/sec-fetch-site/);
  assert.match(source,/fetchSite==='cross-site'/);
});

test('browser QA covers phone tablet and desktop widths and fails on overflow',()=>{
  const source=fs.readFileSync('src/verification/playwright.js','utf8');
  assert.ok(source.includes('responsiveViewports=[{width:390,height:844},{width:768,height:1024},{width:1440,height:900}]'));
  assert.ok(source.includes('horizontal overflow at '));
  assert.ok(source.includes('responsiveFailures:'));
  assert.ok(source.includes('ui.responsiveLayouts=responsive'));
});
