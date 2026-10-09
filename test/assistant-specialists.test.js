import test from 'node:test';
import assert from 'node:assert/strict';
import {routeSpecialists,assistantCapabilityMap} from '../src/assistant/specialists.js';

test('assistant routes ecommerce 3D requests to commerce and 3D specialists',()=>{
  const r=routeSpecialists('Build a 3D furniture store with checkout, product viewer and SEO');
  assert.equal(r[0],'product');assert.ok(r.includes('threeD'));assert.ok(r.includes('seo'));
});

test('assistant exposes specialist scope for each major Build Vibe section',()=>{
  const map=assistantCapabilityMap();
  for(const key of ['product','ux','code','qa','seo','threeD','content','launch','security'])assert.ok(map[key]);
});
