import test from 'node:test';
import assert from 'node:assert/strict';
import {AI_STUDIO_INSPIRED_FEATURES,AI_STUDIO_CHIPS,normalizeBuildModeInput,buildModePreset,appGalleryEntries,annotationContract} from '../src/platform/ai-studio.js';

test('AI Studio inspired feature registry captures original product adaptations',()=>{
  const ids=AI_STUDIO_INSPIRED_FEATURES.map(x=>x.id);
  for(const id of ['build_mode','ai_chips','annotation_mode','app_gallery','github_import_export','multimodal_prompt','platform_selector','verified_preview']) assert.ok(ids.includes(id),id);
});

test('build mode input normalizes chips, platform and annotations safely',()=>{
  const out=normalizeBuildModeInput({
    prompt:'Build a polished site',
    platform:'web',
    chips:['generate-image','maps','unknown'],
    annotations:[{x:12,y:20,width:120,height:50,label:'hero CTA',instruction:'Make this primary'}]
  });
  assert.equal(out.platform,'web');
  assert.deepEqual(out.chips,['generate-image','maps']);
  assert.equal(out.annotations.length,1);
  assert.equal(out.annotations[0].label,'hero CTA');
});

test('gallery entries provide remixable starter metadata and build presets',()=>{
  const entries=appGalleryEntries([{id:'one',label:'Portfolio',kind:'portfolio',prompt:'Build a portfolio'}]);
  assert.equal(entries[0].remixable,true);
  assert.equal(buildModePreset('threeD').platform,'web');
  assert.ok(Array.isArray(buildModePreset('threeD').chips));assert.ok(buildModePreset('threeD').chips.includes('generate-image'));
});

test('annotation contract is bounded and rejects unsafe oversized payloads',()=>{
  assert.throws(()=>annotationContract({instruction:'x'.repeat(5000)}),/too_large/);
  const good=annotationContract({x:10,y:20,width:50,height:40,label:'button',instruction:'make it blue'});
  assert.equal(good.type,'ui-annotation');
  assert.equal(good.width,50);
});
