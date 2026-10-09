import test from 'node:test';
import assert from 'node:assert/strict';
import { applySceneOperation, isPersistableSceneAssetUrl, SCENE_SCHEMA_VERSION, validateSceneDocument } from '../src/scene/scene-document.js';

const scene = () => ({
  schemaVersion: SCENE_SCHEMA_VERSION,
  id: 'scene-home',
  name: 'Home scene',
  nodes: [
    { id: 'root', type: 'group', name: 'Root' },
    { id: 'hero', type: 'box', name: 'Hero', parentId: 'root', position: [0, 1, 0], scale: [1, 1, 1], color: '#ffffff', visible: true }
  ]
});

test('validates a bounded renderer-neutral scene and stable parent references', () => {
  const result = validateSceneDocument(scene());
  assert.equal(result.ok, true);
  assert.equal(result.value.nodes.length, 2);
});

test('rejects unknown fields, duplicate IDs, missing parents, cycles and oversized documents', () => {
  const unknown = scene(); unknown.nodes[0].onClick = 'alert(1)';
  assert.match(validateSceneDocument(unknown).errors.join(' '), /unsupported field/);
  const duplicate = scene(); duplicate.nodes[1].id = 'root';
  assert.match(validateSceneDocument(duplicate).errors.join(' '), /duplicate node id/);
  const missing = scene(); missing.nodes[1].parentId = 'missing';
  assert.match(validateSceneDocument(missing).errors.join(' '), /missing parent/);
  const cyclic = scene(); cyclic.nodes[0].parentId = 'hero';
  assert.match(validateSceneDocument(cyclic).errors.join(' '), /cycle/);
  const oversized = scene(); oversized.nodes = Array.from({ length: 251 }, (_, i) => ({ id: `n${i}`, type: 'group' }));
  assert.match(validateSceneDocument(oversized).errors.join(' '), /at most 250/);
});

test('rejects unsafe asset URLs and invalid transform values', () => {
  const unsafe = scene(); unsafe.nodes[1].assetUrl = 'javascript:alert(1)';
  assert.match(validateSceneDocument(unsafe).errors.join(' '), /assetUrl is invalid/);
  const invalid = scene(); invalid.nodes[1].position = [0, Infinity, 0];
  assert.match(validateSceneDocument(invalid).errors.join(' '), /position is invalid/);
});

test('applies a typed edit and emits a reversible change record without mutating input', () => {
  const original = scene();
  const result = applySceneOperation(original, { op: 'set', nodeId: 'hero', field: 'color', value: '#3b82f6' });
  assert.equal(result.ok, true);
  assert.equal(result.document.nodes[1].color, '#3b82f6');
  assert.equal(result.change.before, '#ffffff');
  assert.equal(result.undo.value, '#ffffff');
  assert.equal(original.nodes[1].color, '#ffffff');
  const withNewField = applySceneOperation(original, { op: 'set', nodeId: 'hero', field: 'text', value: 'Hello' });
  assert.equal(withNewField.ok, true);
  const undone = applySceneOperation(withNewField.document, withNewField.undo);
  assert.equal(undone.ok, true);
  assert.equal(Object.hasOwn(undone.document.nodes[1], 'text'), false);
});

test('rejects arbitrary operation paths, script-like values, and unknown nodes', () => {
  assert.equal(applySceneOperation(scene(), { op: 'set', nodeId: 'hero', field: '__proto__', value: {} }).ok, false);
  assert.equal(applySceneOperation(scene(), { op: 'set', nodeId: 'hero', field: 'text', value: '<script>alert(1)</script>' }).ok, true);
  assert.equal(applySceneOperation(scene(), { op: 'set', nodeId: 'missing', field: 'visible', value: false }).ok, false);
  assert.equal(applySceneOperation(scene(), { op: 'run', code: 'alert(1)' }).ok, false);
});

test('accepts deployment-stable asset paths but rejects traversal and ephemeral URLs for persistence',()=>{
  const relative=scene();relative.nodes[1].assetUrl='/assets/550e8400-e29b-41d4-a716-446655440000-hero.png';
  assert.equal(validateSceneDocument(relative).ok,true);
  assert.equal(isPersistableSceneAssetUrl(relative.nodes[1].assetUrl),true);
  assert.equal(isPersistableSceneAssetUrl('blob:https://example.test/session-url'),false);
  const traversal=scene();traversal.nodes[1].assetUrl='/assets/../private.txt';
  assert.equal(validateSceneDocument(traversal).ok,false);
  const protocolRelative=scene();protocolRelative.nodes[1].assetUrl='//evil.example/asset.png';
  assert.equal(validateSceneDocument(protocolRelative).ok,false);
});

test('typed add/remove operations keep scene structure valid and expose reversible operations',()=>{
  const original=scene();
  const add=applySceneOperation(original,{op:'addNode',node:{id:'media-1',type:'image',name:'Product image',visible:true,position:[0,1,0],assetUrl:'/assets/550e8400-e29b-41d4-a716-446655440000-product.png'}});
  assert.equal(add.ok,true);
  assert.equal(add.document.nodes.length,3);
  assert.deepEqual(add.undo,{op:'removeNode',nodeId:'media-1'});
  const removed=applySceneOperation(add.document,add.undo);
  assert.equal(removed.ok,true);
  assert.equal(removed.document.nodes.length,2);
  const removeParent=applySceneOperation(original,{op:'removeNode',nodeId:'root'});
  assert.equal(removeParent.ok,false);
  assert.match(removeParent.errors.join(' '),/remove child nodes first/);
  const remove=applySceneOperation(add.document,{op:'removeNode',nodeId:'media-1'});
  assert.equal(remove.ok,true);
  assert.deepEqual(remove.undo,{op:'addNode',node:add.document.nodes[2]});
});
