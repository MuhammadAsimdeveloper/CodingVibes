import test from 'node:test';
import assert from 'node:assert/strict';
import {listTemplates,searchTemplates,templatePrompt} from '../src/templates/catalog.js';

test('every template exposes a reusable quality contract and capability map',()=>{
  const templates=listTemplates();
  assert.ok(templates.length>=60);
  for(const template of templates.slice(0,10)){
    assert.equal(template.qualityContract.providerIndependent,true);
    assert.ok(Array.isArray(template.qualityContract.requiredStates));
    assert.ok(Array.isArray(template.capabilities));
  }
});

test('template prompts preserve no-fabrication and restrained-motion rules for every template',async()=>{
  const {templatePrompt}=await import('../src/templates/catalog.js');
  const templates=listTemplates();
  for(const template of templates){
    const prompt=templatePrompt(template.id).toLowerCase();
    assert.match(prompt,/design guidance version/i);
    for(const phrase of ['never use fabricated reviews or customer identities','user supplies verifiable evidence','purple gradients','pill-shaped buttons','cursor-following effects','made with ai']) assert.ok(prompt.includes(phrase),template.id+': '+phrase);
  }
});

test('every template inherits the shared quality baseline and launch essentials',async()=>{
  const {buildQualityContract}=await import('../src/agent/product-quality.js');
  const shared=buildQualityContract({siteKind:'business'});
  const templates=listTemplates();
  for(const template of templates){
    for(const feature of shared.requiredFeatures) assert.ok(template.qualityContract.requiredFeatures.includes(feature),template.id+': '+feature);
    for(const surface of ['/privacy','/terms','/contact']) assert.ok(template.qualityContract.requiredSurfaces.includes(surface),template.id+': '+surface);
    assert.ok(template.qualityContract.designGuidance?.version,template.id+': design guidance version');
    assert.ok(template.qualityContract.hardRules?.some(rule=>/unsupported metrics|fabricated reviews/i.test(rule)),template.id+': anti-fabrication rule');
  }
});

test('raw template briefs do not request fabricated social proof or excessive motion',async()=>{
  for(const template of listTemplates()){
    const prompt=templatePrompt(template.id).split('\n\nDesign guidance version')[0].toLowerCase();
    assert.doesNotMatch(prompt,/testimonials?|social proof|scroll-driven|camera choreography|magnetic interactions|parallax|cinematic transitions/,template.id);
    if(template.id==='business-directory'){
      assert.match(prompt,/real submitted reviews/);
      assert.match(prompt,/never seed invented reviews/);
    }else if(/\breviews?\b/.test(prompt)) assert.match(prompt,/only when the owner supplies verified review data/,template.id);
  }
});

test('template search ranks relevant templates ahead of generic substring matches',()=>{
  const results=searchTemplates('3d property', {limit:5});
  assert.ok(results.length>0);
  assert.equal(results[0].kind,'realEstate');
  assert.equal(results[0].experience,'3d');
});
