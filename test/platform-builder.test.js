import test from 'node:test';
import assert from 'node:assert/strict';
import {buildBlueprint} from '../src/platform/blueprint.js';
import {listCapabilities} from '../src/platform/capabilities.js';
import {builderResearch} from '../src/platform/research.js';

test('universal builder exposes web, backend, CMS and mobile capabilities',()=>{
  const ids=listCapabilities().map(x=>x.id);
  for(const id of ['website','web-app','backend','cms','android','ios','deployment','security'])assert.ok(ids.includes(id),id);
});

test('blueprint chooses a product architecture from natural language',()=>{
  const b=buildBlueprint('Build a marketplace SaaS with customer login, Stripe checkout and an Android app',{targetId:'mobile-expo'});
  assert.equal(b.target.id,'mobile-expo');
  assert.ok(b.productKinds.includes('marketplace'));
  assert.ok(b.capabilities.includes('backend'));
  assert.ok(b.capabilities.includes('commerce'));
  assert.ok(b.capabilities.includes('android'));
  assert.equal(b.architecture.providerNeutral,true);
});

test('research returns documented feature patterns without copying source code',()=>{
  const r=builderResearch();
  assert.ok(r.sources.length>=5);
  assert.ok(r.patterns.some(x=>x.source==='Replit Agent'));
  assert.match(r.methodology,/original interfaces and architecture/i);
});
