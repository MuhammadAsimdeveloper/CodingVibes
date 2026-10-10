import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {buildQualityContract,auditProductExperience} from '../src/agent/product-quality.js';

test('quality contract expands product-specific requirements without external runtime providers',()=>{
  const contract=buildQualityContract({
    siteKind:'ecommerce',
    target:{id:'web-node'},
    behavior:{payments:true,authentication:true},
    experience:{threeD:false},
  });
  assert.equal(contract.providerIndependent,true);
  assert.ok(contract.requiredStates.includes('loading'));
  assert.ok(contract.requiredStates.includes('empty'));
  assert.ok(contract.requiredStates.includes('error'));
  assert.ok(contract.requiredSurfaces.includes('/shop'));
  assert.ok(contract.requiredSurfaces.includes('/checkout'));
  assert.ok(contract.requiredFeatures.includes('local content/data editing'));
});

test('quality audit blocks hard dependency on remote runtime assets and missing accessibility basics',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'build-vibe-quality-contract-'));
  fs.mkdirSync(path.join(root,'public'),{recursive:true});
  fs.writeFileSync(path.join(root,'public','index.html'),'<!doctype html><html><head><title>Test</title><script src="https://cdn.example.com/app.js"></script></head><body><main><h1>Test</h1><img src="/hero.webp"><form><input type="email"></form></main></body></html>','utf8');
  const audit=auditProductExperience(root,{siteKind:'business',target:{id:'web-node'},experience:{threeD:false}});
  assert.equal(audit.providerIndependent,false);
  assert.ok(audit.blockingFindings.some(x=>x.id==='remote_runtime_dependency'));
  assert.ok(audit.blockingFindings.some(x=>x.id==='image_alt_missing'));
  assert.ok(audit.blockingFindings.some(x=>x.id==='form_label_missing'));
  fs.rmSync(root,{recursive:true,force:true});
});

test('quality contract forbids deceptive social proof and default design anti-patterns',()=>{
  const contract=buildQualityContract({siteKind:'saas'});
  const rules=contract.hardRules.join(' ').toLowerCase();
  for(const phrase of ['fabricated reviews','unsupported metrics','purple gradients','cursor-following','pill-shaped buttons','emoji icons','made with ai']) assert.ok(rules.includes(phrase),phrase);
});

test('product audit blocks AI attribution, purple gradients, fabricated proof, emoji icons and distracting motion',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'build-vibe-anti-patterns-'));
  fs.mkdirSync(path.join(root,'public'),{recursive:true});
  fs.writeFileSync(path.join(root,'public','index.html'),`<!doctype html><html lang="en"><head><meta name="description" content="Specific service"><link rel="canonical" href="https://example.com/"><meta property="og:title" content="Example"><meta name="viewport" content="width=device-width"></head><body><nav><a href="/">Home</a></nav><main><h1>Useful product</h1><button class="rounded-full">🚀 Start now</button><p>Trusted by 10,000+ customers</p><p>Made with AI</p><span>Built with Build Vibe</span><p>Built for teams — without compromise.</p><p>Replace the sample copy with your real positioning, proof and team details.</p><img alt="Product preview" src="/preview.png"><img alt="Customer portrait" src="https://thispersondoesnotexist.com/image"></main></body></html>`,'utf8');
  fs.writeFileSync(path.join(root,'public','styles.css'),'.hero{background:linear-gradient(120deg,#7c3aed,#c026d3)} .cursor-follower{position:fixed} .cta{border-radius:9999px}','utf8');
  fs.writeFileSync(path.join(root,'public','motion.js'),"ScrollTrigger.create({trigger:'.hero'}); document.addEventListener('pointermove',moveCursor);",'utf8');
  const audit=auditProductExperience(root,{siteKind:'business',target:{id:'web-node'},experience:{threeD:false}});
  const ids=new Set(audit.checks.filter(x=>!x.passed).map(x=>x.id));
  for(const id of ['unwanted_ai_attribution','builder_attribution','purple_gradient','fabricated_social_proof','emoji_ui_icon','em_dash_copy','placeholder_copy','custom_cursor_animation','excessive_scroll_motion','pill_button_style','placeholder_media']) assert.ok(ids.has(id),id);
  fs.rmSync(root,{recursive:true,force:true});
});

test('media quality gate blocks random placeholders and fake-avatar endpoints but permits curated static assets',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'build-vibe-media-gate-'));
  fs.mkdirSync(path.join(root,'public'),{recursive:true});
  fs.writeFileSync(path.join(root,'public','index.html'),'<html lang="en"><head><meta name="viewport" content="width=device-width"><meta name="description" content="A specific service"><link rel="canonical" href="https://example.com"><meta property="og:title" content="Example"></head><body><nav><a href="/">Home</a></nav><main><h1>Service</h1><img src="https://picsum.photos/800/600" alt="Product image"><img src="https://images.unsplash.com/photo-1500000000000-example" alt="Workspace photograph"></main></body></html>','utf8');
  const audit=auditProductExperience(root,{siteKind:'business',target:{id:'web-node'},experience:{threeD:false}});
  const ids=new Set(audit.checks.filter(x=>!x.passed).map(x=>x.id));
  assert.ok(ids.has('placeholder_media'));
  fs.writeFileSync(path.join(root,'public','index.html'),fs.readFileSync(path.join(root,'public','index.html'),'utf8').replace('https://picsum.photos/800/600','/assets/product-photo.webp'),'utf8');
  const curated=auditProductExperience(root,{siteKind:'business',target:{id:'web-node'},experience:{threeD:false}});
  assert.ok(!curated.checks.some(x=>x.id==='placeholder_media'&&!x.passed));
  fs.rmSync(root,{recursive:true,force:true});
});

test('product audit blocks missing favicon assets and placeholder legal pages',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'build-vibe-legal-gate-'));
  fs.mkdirSync(path.join(root,'public'),{recursive:true});
  fs.writeFileSync(path.join(root,'public','index.html'),'<html lang="en"><head><meta name="viewport" content="width=device-width"><meta name="description" content="A specific service"><link rel="canonical" href="https://example.com"><meta property="og:title" content="Example"></head><body><nav><a href="/">Home</a></nav><main><h1>Service</h1></main></body></html>','utf8');
  fs.writeFileSync(path.join(root,'public','privacy.html'),'<html lang="en"><head></head><body><main><h1>Privacy</h1><p>Explain what information this product collects. Configure production providers before launch.</p></main></body></html>','utf8');
  fs.writeFileSync(path.join(root,'public','terms.html'),'<html lang="en"><head></head><body><main><h1>Terms</h1><p>Replace this launch-ready outline before publishing.</p></main></body></html>','utf8');
  const audit=auditProductExperience(root,{siteKind:'business',target:{id:'web-node'},experience:{threeD:false}});
  const ids=new Set(audit.checks.filter(x=>!x.passed).map(x=>x.id));
  for(const id of ['favicon_asset','privacy_policy_quality','terms_conditions_quality']) assert.ok(ids.has(id),id);
  fs.rmSync(root,{recursive:true,force:true});
});

test('deterministic native and desktop fallbacks provide real navigation shells instead of a placeholder screen',async()=>{
  const {generateTargetFallback}=await import('../src/targets/generator.js');
  const {getTarget}=await import('../src/targets/registry.js');
  const spec={request:'Build an appointment management app',pages:['/','/calendar','/settings'],apis:[],siteKind:'business',behavior:{},experience:{threeD:false}};
  for(const id of ['mobile-flutter','android-kotlin','ios-swiftui','desktop-electron']){
    const plan=generateTargetFallback(spec,getTarget(id));
    const source=plan.files.map(x=>x.content).join('\n');
    assert.match(source,/Home|Dashboard|Settings|Calendar/);
    assert.doesNotMatch(source,/Generated for SwiftUI\\.|\\<p\\>\\$\\{escape/);
  }
});
