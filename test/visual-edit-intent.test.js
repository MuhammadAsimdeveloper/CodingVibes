import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyAssistantRequest} from '../src/assistant/intent.js';

test('targeted design language parses common visual edits',()=>{
 const r=classifyAssistantRequest('make it blue, bigger, centered, bold and rounded');
 assert.ok(r.operations.some(x=>x.css?.color==='#3b82f6'));
 assert.ok(r.operations.some(x=>x.css?.fontSize));
 assert.ok(r.operations.some(x=>x.css?.textAlign==='center'));
 assert.ok(r.operations.some(x=>x.css?.fontWeight==='700'));
 assert.ok(r.operations.some(x=>x.css?.borderRadius));
});

test('visual edits target background safely and reject unsupported requests',()=>{
 const background=classifyAssistantRequest('make the page background blue');
 assert.ok(background.operations.some(x=>x.css?.backgroundColor==='#3b82f6'));
 assert.equal(classifyAssistantRequest('write a newsletter').intent,'unclassified');
});
