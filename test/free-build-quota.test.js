import test from 'node:test';
import assert from 'node:assert/strict';
import {FREE_BUILD_QUOTAS,classifyBuildKind,buildQuotaUsage,canStartBuildQuota,targetPlanGate} from '../src/billing/build-quota.js';
import {getPlan,planCatalog} from '../src/billing/plans.js';

test('free plan exposes separate basic, 3d and animated website allowances',()=>{
  assert.deepEqual(FREE_BUILD_QUOTAS,{basic:3,threeD:1,animated:1});
  const plan=getPlan('free');
  assert.deepEqual(plan.websiteQuotas,{basic:3,threeD:1,animated:1});
  assert.equal(plan.nativeApps,false);
});

test('free builds are classified into stable usage buckets',()=>{
  assert.equal(classifyBuildKind('Build a restaurant landing page'),'basic');
  assert.equal(classifyBuildKind('Create an immersive Three.js product viewer'),'threeD');
  assert.equal(classifyBuildKind('Make the site animated with GSAP scroll reveals'),'animated');
  assert.equal(classifyBuildKind('Build a native Android Kotlin app'),'native');
});

test('free quota counts each bucket without blocking paid plans',()=>{
  const usage=buildQuotaUsage([
    {request:'basic website one'},{request:'basic website two'},{request:'basic website three'},
    {request:'immersive 3d product viewer'},
    {request:'animated landing page with motion'}
  ]);
  assert.deepEqual(usage,{basic:3,threeD:1,animated:1,native:0});
  assert.equal(canStartBuildQuota({plan:'free',request:'another basic website',usage}).ok,false);
  assert.equal(canStartBuildQuota({plan:'free',request:'another 3d site',usage}).ok,false);
  assert.equal(canStartBuildQuota({plan:'pro',request:'another 3d site',usage}).ok,true);
});

test('free plan rejects native APK/AAB and Android targets, paid plans allow them',()=>{
  assert.equal(targetPlanGate({plan:'free',request:'Build an APK for Android',targetId:'android-kotlin'}).ok,false);
  assert.equal(targetPlanGate({plan:'free',request:'Build an Android app',targetId:'mobile-expo'}).ok,false);
  assert.equal(targetPlanGate({plan:'pro',request:'Build an APK for Android',targetId:'android-kotlin'}).ok,true);
});

test('plan catalog exposes website quota and native capability policy',()=>{
  const free=planCatalog({}).find(x=>x.id==='free');
  const pro=planCatalog({}).find(x=>x.id==='pro');
  assert.deepEqual(free.websiteQuotas,{basic:3,threeD:1,animated:1});
  assert.equal(free.nativeApps,false);
  assert.equal(pro.nativeApps,true);
});
