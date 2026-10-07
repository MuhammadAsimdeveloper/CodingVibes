import test from 'node:test';import assert from 'node:assert/strict';import {hasFeature,planCapabilitySummary} from '../src/billing/plans.js';
test('free plan explicitly exposes 3D and animated creation but not native APK',()=>{
 assert.equal(hasFeature('free','three_d_creation'),true);
 assert.equal(hasFeature('free','animated_creation'),true);
 assert.equal(hasFeature('free','native_apk'),false);
 const s=planCapabilitySummary('free');assert.equal(s.apkAvailable,false);assert.equal(s.creationLimits['3d'],1);assert.equal(s.creationLimits.animated,1);
});
