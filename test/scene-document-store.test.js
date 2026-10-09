import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Store } from '../src/db/store.js';
import { SCENE_SCHEMA_VERSION } from '../src/scene/scene-document.js';

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'build-vibe-scene-store-'));
  const store = new Store(path.join(root, 'test.db'));
  const user = store.createUser('scene-owner@example.test', 'test-password-hash');
  const project = store.createProject(user.id, { name: 'Scene project' });
  const scene = {
    schemaVersion: SCENE_SCHEMA_VERSION,
    id: 'persisted-scene',
    name: 'Persisted scene',
    nodes: [{ id: 'hero', type: 'box', name: 'Hero', color: '#8b7dff', visible: true, position: [0, 1, 0] }]
  };
  return { root, store, user, project, scene };
}
function cleanup(f) {
  try { f.store.db.close(); } catch {}
  fs.rmSync(f.root, { recursive: true, force: true });
}

test('scene document persists across Store instances with a monotonic revision', () => {
  const f = fixture();
  try {
    assert.equal(f.store.getSceneDocument(f.project.id, f.user.id), null);
    const first = f.store.saveSceneDocument(f.project.id, f.user.id, f.scene, { expectedRevision: 0 });
    assert.equal(first.revision, 1);
    const changed = structuredClone(f.scene);
    changed.nodes[0].color = '#ff0000';
    const second = f.store.saveSceneDocument(f.project.id, f.user.id, changed, { expectedRevision: 1 });
    assert.equal(second.revision, 2);
    f.store.db.close();
    const reopened = new Store(path.join(f.root, 'test.db'));
    try {
      const loaded = reopened.getSceneDocument(f.project.id, f.user.id);
      assert.equal(loaded.revision, 2);
      assert.equal(loaded.scene.nodes[0].color, '#ff0000');
    } finally { reopened.db.close(); }
  } finally { cleanup(f); }
});

test('scene save rejects stale expected revisions without overwriting newer edits', () => {
  const f = fixture();
  try {
    f.store.saveSceneDocument(f.project.id, f.user.id, f.scene, { expectedRevision: 0 });
    const stale = structuredClone(f.scene); stale.nodes[0].color = '#ff0000';
    assert.throws(
      () => f.store.saveSceneDocument(f.project.id, f.user.id, stale, { expectedRevision: 0 }),
      error => error.code === 'scene_revision_conflict' && error.currentRevision === 1
    );
    assert.equal(f.store.getSceneDocument(f.project.id, f.user.id).scene.nodes[0].color, '#8b7dff');
  } finally { cleanup(f); }
});

test('scene document reads and writes enforce project membership through Store access checks', () => {
  const f = fixture();
  try {
    const other = f.store.createUser('other-user@example.test', 'test-password-hash');
    assert.equal(f.store.getSceneDocument(f.project.id, other.id), null);
    assert.throws(() => f.store.saveSceneDocument(f.project.id, other.id, f.scene), /Project not found/);
  } finally { cleanup(f); }
});
