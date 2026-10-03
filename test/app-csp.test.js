import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('app shell stays compatible with self-only stylesheet CSP',()=>{
  const html=fs.readFileSync('public/index.html','utf8');
  assert.doesNotMatch(html,/<style[\s>]/i);
  assert.doesNotMatch(html,/\sstyle\s*=/i);
  assert.match(html,/app-shell\.css/);
});

test('workspace motion uses stylesheet attributes instead of inline transition styles',()=>{
  const js=fs.readFileSync('public/workspace-motion.js','utf8');
  assert.doesNotMatch(js,/\.style\.transitionDelay/);
  assert.match(js,/dataset\.revealIndex/);
});
