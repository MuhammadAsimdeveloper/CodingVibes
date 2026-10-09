import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [editor, sceneDocument, runtime] = await Promise.all([
  readFile(new URL('../public/scene-editor-ui.js', import.meta.url), 'utf8'),
  readFile(new URL('../public/scene/scene-document.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/templates/runtime/three-experience.js', import.meta.url), 'utf8')
]);

test('scene editor supports adding/removing nodes and attaching uploaded image, video and model files',()=>{
  assert.match(editor,/op: 'addNode'/);
  assert.match(editor,/op: 'removeNode'/);
  assert.match(editor,/async function uploadAssetForNode/);
  assert.match(editor,/x-asset-name/);
  assert.match(editor,/x-asset-role/);
  for(const type of ['image','video','model'])assert.ok(editor.includes("'" + type + "'"),'editor supports '+type+' nodes');
  assert.match(editor,/\/api\/projects\/' \+ encodeURIComponent\(projectId\) \+ '\/assets/);
  assert.match(editor,/sceneAssetsByPath\.set\(asset\.publicPath/);
});

test('editor uses private same-origin preview URLs while stored scenes retain deployment URLs',()=>{
  assert.match(editor,/\/preview/);
  assert.match(editor,/node\.assetUrl = '\/api\/projects\/'/);
  assert.match(editor,/node\.assetUrl\.startsWith\('\/assets\/'\)/);
  assert.match(sceneDocument,/isPersistableSceneAssetUrl/);
  assert.match(sceneDocument,/function safeAssetUrl\(value\)/);
  assert.match(runtime,/function validAssetUrl\(value\)/);
});
