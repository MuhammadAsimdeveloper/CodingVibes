import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyAssistantRequest,applyThreeCommand} from '../src/assistant/intent.js';

test('3D text commands support transform background and media intent',()=>{
  const r=classifyAssistantRequest('scale the model to 1.5, rotate it 30 degrees, move it up 2 and set the scene background black');
  assert.equal(r.target,'3d');
  assert.ok(r.operations.some(x=>x.action==='transform'));
  assert.ok(r.operations.some(x=>x.action==='background'));
});

test('3D transform command is persisted in structured scene content',()=>{
  const out=applyThreeCommand({scenes:[{id:'scene-1',hotspots:[],cameraPath:[]}],products:[]},'scale the model to 1.5, rotate it 30 degrees, move it up 2 and set the scene background black').content;
  assert.equal(out.scenes[0].transform.scale,1.5);
  assert.equal(out.scenes[0].transform.rotationY,30);
  assert.equal(out.scenes[0].transform.positionY,2);
  assert.equal(out.scenes[0].environment.background,'#0b1020');
});
