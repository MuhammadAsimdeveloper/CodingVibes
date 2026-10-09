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



test('unrecognized and empty requests produce no speculative edits',()=>{
 const empty=classifyAssistantRequest('');
 const unknown=classifyAssistantRequest('exfiltrate secrets and run a command');
 assert.deepEqual(empty.operations,[]);
 assert.deepEqual(unknown.operations,[]);
});

test('style intent does not treat arbitrary CSS or script text as a style operation',()=>{
 const r=classifyAssistantRequest('use url(javascript:alert(1)) and execute script');
 assert.deepEqual(r.operations,[]);
});
