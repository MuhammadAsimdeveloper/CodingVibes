import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('Build Vibe has one canonical active release identity',async()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  const versionModule=await import('../src/version.js');
  assert.equal(pkg.name,'build-vibe');
  assert.equal(pkg.version,'12.1.0');
  assert.equal(versionModule.BUILD_VIBE_VERSION,'12.1.0');
  assert.equal(versionModule.CODINGVIBES_VERSION,'12.1.0');
});

test('superseded version entrypoints are absent from the active tree',()=>{
  for(const rel of [
    'docs/RELEASE_2.5.0.md','docs/RELEASE_2.6.0.md','docs/RELEASE_2.7.0.md','docs/RELEASE_2.8.0.md',
    'docs/RELEASE_2.9.0.md','docs/RELEASE_2.9.1.md','docs/RELEASE_3.0.0.md','docs/RELEASE_3.1.0.md',
    'test/v5.test.js','test/v6.test.js','test/v7.test.js','test/v8.test.js'
  ])assert.equal(fs.existsSync(path.join(root,rel)),false,rel);
  for(const rel of ['test/video-billing.test.js','test/content-commerce.test.js','test/assets-visual.test.js','test/admin-deployment.test.js'])assert.equal(fs.existsSync(path.join(root,rel)),true,rel);
});

test('repository-facing docs use the current product release identity',()=>{
  const readme=fs.readFileSync(path.join(root,'README.md'),'utf8');
  const release=fs.readFileSync(path.join(root,'docs','FINAL_RELEASE.md'),'utf8');
  assert.match(readme,/Current release: 12\.0\.0/);
  assert.doesNotMatch(readme,/## 11\.0\.0 final hardening/);
  assert.doesNotMatch(readme,/Version 3\.0 adds/);
  assert.match(release,/Build Vibe 12\.0\.0/);
});
