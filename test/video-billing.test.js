import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {featureGate,hasFeature} from '../src/billing/features.js';
import {getPlan} from '../src/billing/plans.js';
import {normalizeVideoRequest} from '../src/media/runway.js';
import {Store} from '../src/db/store.js';

test('free plan keeps basic sites and code editor while gating advanced features',()=>{
  assert.equal(hasFeature('free','basic_site'),true);
  assert.equal(hasFeature('free','code_editor'),true);
  assert.equal(hasFeature('free','advanced_animation'),false);
  assert.equal(featureGate('free','Build a responsive SaaS landing page').ok,true);
  const gate=featureGate('free','Build an immersive Three.js 3D website');
  assert.equal(gate.ok,true);
  assert.equal(gate.requested.includes('three_d_creation'),true);
  assert.equal(gate.blocked.includes('advanced_animation'),false);
  const animatedGate=featureGate('free','Build an animated landing page');
  assert.equal(animatedGate.ok,true);
  assert.equal(hasFeature('free','advanced_animation'),false);
});

test('paid plans expose advanced motion, video, deployment and SEO',()=>{
  const pro=getPlan('pro');
  for(const feature of ['advanced_animation','ai_video','advanced_seo','deployment'])assert.equal(pro.features.includes(feature),true);
});

test('video request is bounded to supported durations and ratios',()=>{
  assert.deepEqual(normalizeVideoRequest({prompt:'cinematic robot walking',duration:5,ratio:'1280:720'}),{prompt:'cinematic robot walking',duration:5,ratio:'1280:720',model:process.env.CODINGVIBES_VIDEO_MODEL||'gen4_turbo'});
  assert.throws(()=>normalizeVideoRequest({prompt:'x',duration:7}),/video_duration_must_be_5_or_10/);
});

test('free video trial is persisted atomically',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cv-v5-'));
  const store=new Store(path.join(dir,'db.sqlite'));
  const user=store.createUser('v5@example.com','hash');
  assert.equal(store.consumeVideoTrial(user.id),true);
  assert.equal(store.consumeVideoTrial(user.id),false);
  assert.equal(store.getBilling(user.id).video_trial_used,1);
  store.close();
  fs.rmSync(dir,{recursive:true,force:true});
});
