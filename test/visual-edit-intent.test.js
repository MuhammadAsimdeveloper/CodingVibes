import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyAssistantRequest} from '../src/assistant/intent.js';

test('targeted design language parses common visual edits', () => {
  const result = classifyAssistantRequest('make it blue, bigger, centered, bold and rounded');
  assert.ok(result.operations.some(operation => operation.css?.color === '#3b82f6'));
  assert.ok(result.operations.some(operation => operation.css?.fontSize));
  assert.ok(result.operations.some(operation => operation.css?.textAlign === 'center'));
  assert.ok(result.operations.some(operation => operation.css?.fontWeight === '700'));
  assert.ok(result.operations.some(operation => operation.css?.borderRadius));
  assert.equal(result.intent, 'visual_edit');
  assert.equal(result.requiresSelection, true);
});

test('unknown requests do not produce executable or arbitrary CSS', () => {
  const result = classifyAssistantRequest('tell me a joke');
  assert.equal(result.intent, 'general');
  assert.deepEqual(result.operations, []);
});

test('visual edit parser only emits allow-listed CSS properties and bounded values', () => {
  const result = classifyAssistantRequest('make it blue and bigger; run javascript:alert(1)');
  const allowed = new Set(['color','backgroundColor','fontSize','textAlign','fontWeight','borderRadius','padding','boxShadow']);
  assert.ok(result.operations.length > 0);
  for (const operation of result.operations) {
    assert.deepEqual(Object.keys(operation.css).filter(key => !allowed.has(key)), []);
    assert.equal(operation.target, 'selected');
    for (const value of Object.values(operation.css)) assert.equal(typeof value, 'string');
  }
});
