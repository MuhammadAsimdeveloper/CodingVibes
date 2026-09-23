import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');

test('v3.1 workspace UX assets are wired into the application',()=>{
  const html=read('public/index.html');
  const css=read('public/styles.css');
  const js=read('public/workspace.js');
  assert.match(html,/workspace\.js/);
  assert.match(css,/workspace-toolbar/);
  assert.match(js,/data-intent/);
  assert.match(js,/command-palette/);
  assert.match(js,/Ctrl\/Cmd\+K/);
});

test('v3.1 workspace supports explicit build, modify, debug and review intents',()=>{
  const js=read('public/workspace.js');
  for(const intent of ['build','modify','debug','review']) assert.match(js,new RegExp("['\"]"+intent+"['\"]"));
  assert.match(js,/Modify the existing project:/);
  assert.match(js,/Debug and fix the existing project:/);
  assert.match(js,/Review the existing project/);
});
