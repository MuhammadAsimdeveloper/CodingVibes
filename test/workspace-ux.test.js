import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');

test('visual product studio replaces the code-first workspace UI',()=>{
  const html=read('public/index.html');
  const js=read('public/studio.js');
  assert.match(html,/AI PRODUCT BUILDER/);
  assert.match(html,/Content & data/);
  assert.match(html,/Web & mobile/);
  assert.match(html,/Publish anywhere/);
  assert.match(html,/studio\.js/);
  assert.doesNotMatch(html,/workspace\.js/);
  assert.doesNotMatch(html,/>Files</);
  assert.doesNotMatch(html,/>Diff</);
  assert.match(js,/api\/builder\/blueprint/);
  assert.match(js,/api\/builder\/research/);
});

test('product studio keeps natural-language build flow and visual preview',()=>{
  const html=read('public/index.html');
  assert.match(html,/Describe it\. We build it/);
  assert.match(html,/Live product/);
  assert.match(html,/Build product/);
  assert.match(html,/targetSelect/);
});
