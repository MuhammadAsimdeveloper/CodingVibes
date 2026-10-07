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
