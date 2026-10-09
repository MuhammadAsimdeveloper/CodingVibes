import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [runtime, server] = await Promise.all([
  readFile(new URL('../src/templates/runtime/three-experience.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/server.js', import.meta.url), 'utf8')
]);

test('generated Three.js runtime loads the published saved-scene document', () => {
  assert.match(runtime, /fetch\('\/content\/scene\.json'/);
  assert.match(runtime, /candidate\?\.schemaVersion===1/);
  assert.match(runtime, /function buildSavedScene\(documentData\)/);
  for (const nodeType of ['group', 'box', 'sphere', 'plane', 'text', 'image', 'video', 'model', 'light']) {
    assert.ok(runtime.includes("node.type==='" + nodeType + "'"), 'runtime supports ' + nodeType + ' nodes');
  }
  assert.match(runtime, /savedSceneTextures\.clear\(\)/);
  assert.match(runtime, /savedSceneVideos\.clear\(\)/);
});

test('deployment sync writes validated scene documents and preserves persistent asset files', () => {
  assert.match(server, /const scenePath=path\.join\(workspace,'public','content','scene\.json'\)/);
  assert.match(server, /validateSceneDocument\(saved\.scene\)/);
  assert.match(server, /node\.assetUrl\.startsWith\('blob:'\)\)delete node\.assetUrl/);
  assert.match(server, /fs\.writeFileSync\(scenePath,JSON\.stringify\(published,null,2\),'utf8'\)/);
  assert.match(server, /else fs\.rmSync\(scenePath,\{force:true\}\)/);
  assert.match(server, /async function syncDeploymentContent\(/);
  assert.match(server, /store\.listProjectAssets\(projectId,userId\)/);
  assert.match(server, /hashBuffer\(desired\)/);
  assert.equal(server.includes("fs.rmSync(dst,{recursive:true,force:true})"), false, 'sync must merge, not delete the whole output assets directory');
  assert.match(runtime, /function validAssetUrl\(value\)/);
  assert.match(runtime, /value\.includes\('\.\.'\)/);
  assert.match(runtime, /\/assets\//);
  assert.match(server, /validateAssetContent\(\{name,mime,body\}\)/);
});
