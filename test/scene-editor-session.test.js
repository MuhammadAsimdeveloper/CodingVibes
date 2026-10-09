import test from 'node:test';
import assert from 'node:assert/strict';
import { SceneEditorSession } from '../src/scene/scene-editor-session.js';
import { SCENE_SCHEMA_VERSION } from '../src/scene/scene-document.js';

const scene = () => ({
  schemaVersion: SCENE_SCHEMA_VERSION,
  id: 'scene-session',
  name: 'Session',
  nodes: [{ id: 'hero', type: 'box', name: 'Hero', color: '#ffffff', visible: true, position: [0, 0, 0] }]
});

test('session exposes a reviewable preview and only changes the document after confirmation', () => {
  const session = new SceneEditorSession(scene());
  const preview = session.preview('make Hero blue');
  assert.equal(preview.ok, true);
  assert.equal(preview.after.nodes[0].color, '#3b82f6');
  assert.equal(session.document.nodes[0].color, '#ffffff');
  assert.equal(session.getState().canConfirm, true);

  const applied = session.confirm();
  assert.equal(applied.ok, true);
  assert.equal(session.document.nodes[0].color, '#3b82f6');
  assert.equal(session.getState().revision, 1);
  assert.equal(session.getState().pendingPreview, null);
});

test('cancel and unsupported prompts never change the scene', () => {
  const session = new SceneEditorSession(scene());
  session.preview('make Hero blue');
  assert.equal(session.cancel().status, 'preview_cancelled');
  assert.equal(session.confirm().status, 'no_pending_preview');
  assert.equal(session.preview('make Hero dance').ok, false);
  assert.equal(session.document.nodes[0].color, '#ffffff');
  assert.equal(session.getState().revision, 0);
});

test('undo and redo clear pending previews and update the session revision', () => {
  const session = new SceneEditorSession(scene());
  session.preview('make Hero blue');
  session.confirm();
  session.preview('hide Hero');
  const undone = session.undo();
  assert.equal(undone.ok, true);
  assert.equal(session.getState().pendingPreview, null);
  assert.equal(session.document.nodes[0].color, '#ffffff');
  assert.equal(session.document.nodes[0].visible, true);
  assert.equal(session.getState().revision, 2);
  assert.equal(session.redo().ok, true);
  assert.equal(session.document.nodes[0].color, '#3b82f6');
  assert.equal(session.getState().revision, 3);
});

test('returned state is detached from internal pending preview and document snapshots', () => {
  const session = new SceneEditorSession(scene());
  session.preview('make Hero blue');
  const state = session.getState();
  state.pendingPreview.after.nodes[0].color = '#ff0000';
  state.document.nodes[0].color = '#ff0000';
  assert.equal(session.document.nodes[0].color, '#ffffff');
  assert.equal(session.confirm().document.nodes[0].color, '#3b82f6');
});
