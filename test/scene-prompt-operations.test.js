import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSceneEditIntent } from '../src/scene/prompt-operations.js';
import { SCENE_SCHEMA_VERSION } from '../src/scene/scene-document.js';

const scene = () => ({
  schemaVersion: SCENE_SCHEMA_VERSION,
  id: 'scene-home',
  name: 'Home',
  nodes: [
    { id: 'hero', type: 'box', name: 'Hero', position: [0, 0, 0], color: '#ffffff', visible: true },
    { id: 'logo', type: 'image', name: 'Logo', position: [1, 0, 0], visible: true }
  ]
});

test('maps named-node color, visibility, position and rename requests to typed operations', () => {
  assert.deepEqual(parseSceneEditIntent('make Hero blue', scene()).operations, [
    { op: 'set', nodeId: 'hero', field: 'color', value: '#3b82f6' }
  ]);
  assert.deepEqual(parseSceneEditIntent('hide Logo', scene()).operations, [
    { op: 'set', nodeId: 'logo', field: 'visible', value: false }
  ]);
  assert.deepEqual(parseSceneEditIntent('move Hero x to 4.5', scene()).operations, [
    { op: 'set', nodeId: 'hero', field: 'position', value: [4.5, 0, 0] }
  ]);
  assert.deepEqual(parseSceneEditIntent('rename Hero to Main Hero', scene()).operations, [
    { op: 'set', nodeId: 'hero', field: 'name', value: 'main hero' }
  ]);
});

test('requires a unique target and refuses unsupported or oversized instructions', () => {
  assert.equal(parseSceneEditIntent('make it blue', scene()).ok, false);
  assert.equal(parseSceneEditIntent('make Hero dance', scene()).ok, false);
  assert.equal(parseSceneEditIntent('make Hero blue', scene()).ok, true);
  assert.equal(parseSceneEditIntent('x'.repeat(501), scene()).ok, false);
});

test('rejects unsafe invalid scene input before parsing a request', () => {
  const invalid = scene(); invalid.nodes[0].assetUrl = 'javascript:alert(1)';
  assert.equal(parseSceneEditIntent('make Hero blue', invalid).intent, 'invalid_scene');
});
