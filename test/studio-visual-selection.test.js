import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
const studio=fs.readFileSync(path.join(root,'public/studio.js'),'utf8');

test('Studio exposes an opt-in visual selector and prompt handoff without relaxing iframe sandboxing', () => {
  assert.match(html,/id="previewFrame"[^>]*sandbox="allow-scripts allow-forms"/);
  assert.match(html,/id="visualSelectToggle"/);
  assert.match(html,/id="visualAddToPrompt"/);
  assert.match(html,/id="visualSelectStatus"[^>]*aria-live="polite"/);
  assert.match(studio,/buildvibe:visual-edit-toggle/);
  assert.match(studio,/buildvibe:visual-select/);
  assert.match(studio,/event\.source\s*!==\s*frame\.contentWindow/);
  assert.match(studio,/Visual selection from the current preview/);
  assert.match(studio,/aria-pressed/);
});


test('research results render as text nodes and only link to validated HTTP(S) URLs', () => {
  const start=studio.indexOf('async function loadResearch(){');
  const end=studio.indexOf('\nasync function loadWorkspaceSuite()', start);
  assert.ok(start >= 0 && end > start, 'research renderer is present and bounded');
  const renderer=studio.slice(start,end);
  assert.doesNotMatch(renderer, /\.innerHTML\s*=/);
  assert.match(renderer, /methodologyNode\.textContent\s*=/);
  assert.match(renderer, /sourceName\.textContent\s*=/);
  assert.match(renderer, /patternsNode\.textContent\s*=/);
  assert.match(renderer, /new URL\(/);
  assert.match(renderer, /https:\/\//);
  assert.match(renderer, /noopener noreferrer/);
});
