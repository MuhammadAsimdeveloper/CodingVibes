import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyCreationType,creationQuotaForPlan,canStartCreation} from '../src/billing/plans.js';

test('free plan gives exactly 3 basic, 1 3D and 1 animated site entitlements',()=>{
  assert.equal(creationQuotaForPlan('free','basic'),3);
  assert.equal(creationQuotaForPlan('free','3d'),1);
  assert.equal(creationQuotaForPlan('free','animated'),1);
});
test('creation classifier distinguishes 3D, animated, APK and basic',()=>{
  assert.equal(classifyCreationType('Build an immersive 3D property tour').type,'3d');
  assert.equal(classifyCreationType('Build an animated portfolio with motion').type,'animated');
  assert.equal(classifyCreationType('Build an Android APK with Kotlin').type,'apk');
  assert.equal(classifyCreationType('Build a company website').type,'basic');
});
test('free plan blocks APK but permits an in-quota 3D creation',()=>{
  assert.equal(canStartCreation({plan:'free',type:'apk',used:0}).ok,false);
  assert.equal(canStartCreation({plan:'free',type:'3d',used:0}).ok,true);
  assert.equal(canStartCreation({plan:'free',type:'3d',used:1}).ok,false);
});