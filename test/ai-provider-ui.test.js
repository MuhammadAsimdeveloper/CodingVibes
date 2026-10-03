import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('app exposes an AI provider control surface', () => {
  const html = fs.readFileSync('public/index.html','utf8');
  assert.match(html,/ai-providers\.css/);
  assert.match(html,/ai-providers\.js/);
});

test('AI provider UI includes BYO provider, routing and plugin token controls', () => {
  const js = fs.readFileSync('public/ai-providers.js','utf8');
  assert.match(js,/\/api\/ai\/providers/);
  assert.match(js,/\/api\/ai\/settings/);
  assert.match(js,/\/api\/ai\/tokens/);
  assert.match(js,/primary/);
  assert.match(js,/fallback/);
  const css = fs.readFileSync('public/ai-providers.css','utf8');
  assert.match(css,/\.cv-ai-modal/);
  assert.match(css,/prefers-reduced-motion/);
});
