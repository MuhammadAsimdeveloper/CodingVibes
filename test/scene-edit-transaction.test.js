import test from 'node:test';
import assert from 'node:assert/strict';
import { commitSceneEditPreview, previewSceneEdit } from '../src/scene/scene-edit-transaction.js';
import { applySceneOperation, SCENE_SCHEMA_VERSION } from '../src/scene/scene-document.js';

const scene = () => ({
  schemaVersion: SCENE_SCHEMA_VERSION,
  id: 'scene-home',
  name: 'Home',
  nodes: [
    { id: 'hero', type: 'box', name: 'Hero', color: '#ffffff', visible: true, position: [0, 0, 0] },
    { id: 'logo', type: 'image', name: 'Logo', visible: true, position: [1, 0, 0] }
  ]
});

test('preview is side-effect-free and commit returns an updated document with undo operations', () => {
  const original = scene();
  const preview = previewSceneEdit('make Hero blue', original);
  assert.equal(preview.ok, true);
  assert.equal(preview.status, 'preview');
  assert.equal(preview.after.nodes[0].color, '#3b82f6');
  assert.equal(original.nodes[0].color, '#ffffff');

  const committed = commitSceneEditPreview(original, preview);
  assert.equal(committed.ok, true);
  assert.equal(committed.status, 'applied');
  assert.equal(committed.document.nodes[0].color, '#3b82f6');
  assert.equal(original.nodes[0].color, '#ffffff');

  let undone = committed.document;
  for (const operation of committed.undoOperations) {
    const result = applySceneOperation(undone, operation);
    assert.equal(result.ok, true);
    undone = result.document;
  }
  assert.equal(undone.nodes[0].color, '#ffffff');
});

test('refuses stale previews when the scene changed after the user reviewed it', () => {
  const original = scene();
  const preview = previewSceneEdit('hide Logo', original);
  const changed = applySceneOperation(original, { op: 'set', nodeId: 'logo', field: 'visible', value: false }).document;
  const result = commitSceneEditPreview(changed, preview);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'stale_preview');
});

test('does not accept tampered preview operations or malformed previews', () => {
  const original = scene();
  const preview = previewSceneEdit('make Hero blue', original);
  preview.operations[0].value = '#ff0000';
  const result = commitSceneEditPreview(original, preview);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'invalid_preview');
  assert.equal(commitSceneEditPreview(original, {}).status, 'invalid_preview');
});

test('unsupported intent returns no preview and never mutates the scene', () => {
  const original = scene();
  const preview = previewSceneEdit('make Hero dance', original);
  assert.equal(preview.ok, false);
  assert.equal(preview.status, 'unsupported');
  assert.equal(original.nodes[0].color, '#ffffff');
});
