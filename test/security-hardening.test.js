import test from 'node:test';
import assert from 'node:assert/strict';
import {sanitizeProductEvent} from '../src/ops/product-analytics.js';
import {normalizeFeatureFlag} from '../src/ops/feature-flags.js';

test('sanitizers ignore prototype-pollution keys without mutating global prototypes',()=>{
  const original={};
  const event=sanitizeProductEvent({event:'security.test',properties:{__proto__:{polluted:true},constructor:{polluted:true},prototype:{polluted:true},ok:'safe'}});
  assert.equal(event.properties.ok,'safe');
  assert.equal(({}).polluted,undefined);
  const flag=normalizeFeatureFlag({key:'safe',config:{__proto__:{polluted:true},constructor:{polluted:true},prototype:{polluted:true},ok:true}});
  assert.equal(flag.config.ok,true);
  assert.equal(({}).polluted,undefined);
  assert.deepEqual(original,{});
});

test('feature flag rollout remains bounded under malicious config values',()=>{
  const flag=normalizeFeatureFlag({key:'bounded',rolloutPercentage:999,config:{large:'x'.repeat(9000)}});
  assert.equal(flag.rolloutPercentage,100);
  assert.equal(flag.config.large.length,4000);
});
