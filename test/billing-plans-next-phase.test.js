import test from 'node:test';import assert from 'node:assert/strict';import {PLANS,buildQuotaSummary,quotaForRequest,canCreateWithPlan} from '../src/billing/plans.js';
test('free plan exposes 3 basic, 1 3D and 1 animated website allowances and zero APK',()=>{
 const p=PLANS.free;
 assert.equal(p.priceUsd,0);assert.equal(p.quotas.basicProjects,3);assert.equal(p.quotas.threeDProjects,1);assert.equal(p.quotas.animatedProjects,1);assert.equal(p.quotas.apkProjects,0);
});
test('quota classifier distinguishes 3D, animated and APK requests',()=>{
 assert.equal(quotaForRequest('build a 3D product site'),'threeDProjects');
 assert.equal(quotaForRequest('build a cinematic animated portfolio'),'animatedProjects');
 assert.equal(quotaForRequest('build an Android APK'),'apkProjects');
 assert.equal(quotaForRequest('build a normal company website'),'basicProjects');
});
test('free user can use one 3D build but not a second and never APK',()=>{
 assert.equal(canCreateWithPlan('free','build a 3D product site',{threeDProjects:0,basicProjects:0,animatedProjects:0,apkProjects:0}).ok,true);
 assert.equal(canCreateWithPlan('free','build a 3D product site',{threeDProjects:1,basicProjects:0,animatedProjects:0,apkProjects:0}).ok,false);
 assert.equal(canCreateWithPlan('free','build an Android APK',{threeDProjects:0,basicProjects:0,animatedProjects:0,apkProjects:0}).ok,false);
 assert.equal(buildQuotaSummary('free',{basicProjects:2,threeDProjects:1,animatedProjects:0,apkProjects:0}).basicProjects.remaining,1);
});
