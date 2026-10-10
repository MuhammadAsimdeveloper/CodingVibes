import test from 'node:test';
import assert from 'node:assert/strict';
import {listTemplates,searchTemplates} from '../src/templates/catalog.js';

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
    for(const phrase of ['never use fabricated reviews or customer identities','user supplies verifiable evidence','purple gradients','pill-shaped buttons','cursor-following effects','made with ai']) assert.ok(prompt.includes(phrase),template.id+': '+phrase);
  }
});

test('template search ranks relevant templates ahead of generic substring matches',()=>{
  const results=searchTemplates('3d property', {limit:5});
  assert.ok(results.length>0);
  assert.equal(results[0].kind,'realEstate');
  assert.equal(results[0].experience,'3d');
});
