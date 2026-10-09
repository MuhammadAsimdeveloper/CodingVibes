import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';
test('preview visual runtime supports command-based annotation edits',()=>{
 const source=fs.readFileSync(new URL('../public/visual-edit.js',import.meta.url),'utf8');
 assert.match(source,/buildvibe:visual-command/);assert.match(source,/data-visual-selection/);assert.match(source,/buildvibe:visual-select/);
});