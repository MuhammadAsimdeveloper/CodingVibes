import test from 'node:test';
import assert from 'node:assert/strict';
import { SceneEditHistory } from '../src/scene/scene-edit-history.js';
import { previewSceneEdit } from '../src/scene/scene-edit-transaction.js';
import { SCENE_SCHEMA_VERSION } from '../src/scene/scene-document.js';

const scene = () => ({
  schemaVersion: SCENE_SCHEMA_VERSION, id: 'scene-history', name: 'History',
  nodes: [{ id: 'hero', type: 'box', name: 'Hero', color: '#ffffff', visible: true, position: [0, 0, 0] }]
});

test('history commits, undoes and redoes scene edits without mutating returned snapshots', () => {
  const history = new SceneEditHistory(scene());
  const original = history.document;
  const preview = previewSceneEdit('make Hero blue', original);
  const committed = history.commit(preview);
  assert.equal(committed.ok, true);
  assert.equal(history.document.nodes[0].color, '#3b82f6');
  const undo = history.undo();
  assert.equal(undo.ok, true);
  assert.equal(history.document.nodes[0].color, '#ffffff');
  assert.equal(undo.history.canRedo, true);
  const redo = history.redo();
  assert.equal(redo.ok, true);
  assert.equal(history.document.nodes[0].color, '#3b82f6');
  assert.equal(original.nodes[0].color, '#ffffff');
});

test('a new edit clears redo history and empty history returns explicit states', () => {
  const history = new SceneEditHistory(scene());
  assert.equal(history.undo().status, 'nothing_to_undo');
  assert.equal(history.redo().status, 'nothing_to_redo');
  history.commit(previewSceneEdit('make Hero blue', history.document));
  history.undo();
  history.commit(previewSceneEdit('hide Hero', history.document));
  assert.equal(history.getState().canRedo, false);
  assert.equal(history.document.nodes[0].visible, false);
});

test('history is bounded and rejects invalid limits and invalid initial scenes', () => {
  assert.throws(() => new SceneEditHistory(scene(), { limit: 0 }), /history limit/);
  assert.throws(() => new SceneEditHistory({}), /invalid document/);
  const history = new SceneEditHistory(scene(), { limit: 1 });
  history.commit(previewSceneEdit('make Hero blue', history.document));
  history.commit(previewSceneEdit('hide Hero', history.document));
  assert.equal(history.getState().undoCount, 1);
  history.undo();
  assert.equal(history.document.nodes[0].visible, true);
  assert.equal(history.document.nodes[0].color, '#3b82f6');
});
