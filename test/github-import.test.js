import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeGitHubRepo} from '../src/integrations/github.js';

test('GitHub importer validates repository identity and strips .git suffix',()=>{
  assert.deepEqual(normalizeGitHubRepo({owner:'octo-user',repo:'demo-app.git',ref:'main'}),{owner:'octo-user',repo:'demo-app',ref:'main'});
  assert.throws(()=>normalizeGitHubRepo({owner:'https://evil.example',repo:'demo'}),/valid GitHub/);
  assert.throws(()=>normalizeGitHubRepo({owner:'octo',repo:'demo',ref:'main\n--upload-pack=evil'}),/invalid GitHub ref/);
});
