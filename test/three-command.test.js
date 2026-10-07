import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyAssistantRequest,applyThreeCommand} from '../src/assistant/intent.js';

test('3D text commands map to safe scene/content operations',()=>{
  const a=classifyAssistantRequest('add a kitchen hotspot, make the product red, and use the hero video as the walkthrough');
  assert.equal(a.mode,'modify');
  assert.equal(a.target,'3d');
  assert.ok(a.operations.some(x=>x.type==='content'&&x.collection==='scenes'));
  assert.ok(a.operations.some(x=>x.type==='content'&&x.collection==='products'));
  const applied=applyThreeCommand({kind:'immersive',scenes:[{id:'scene-1',hotspots:[]}],products:[{id:'p1'}]},'set camera tour to slow cinematic');
  assert.equal(applied.content.scenes[0].cameraPath[0].duration,4);
});
