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
