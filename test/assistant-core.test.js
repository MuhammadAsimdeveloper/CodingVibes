import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyAssistantIntent, buildClarification, buildAssistantSystem, trimConversation} from '../src/ai/assistant.js';

test('classifyAssistantIntent recognizes conversational micro-edits',()=>{
  assert.equal(classifyAssistantIntent('make the buttons blue'), 'design_edit');
  assert.equal(classifyAssistantIntent('change the car color to black'), 'product_3d_edit');
  assert.equal(classifyAssistantIntent('add a product called BMW X5 with 8 photos and a GLB model'), 'catalog_edit');
  assert.equal(classifyAssistantIntent('add a 360 walkthrough and a room hotspot'), 'experience_3d_edit');
});

test('clarification builder returns focused selectable questions for underspecified builds',()=>{
  const result=buildClarification('build me a website');
  assert.equal(result.required,true);
  assert.ok(result.questions.length>=2);
  assert.ok(result.questions.every(q=>Array.isArray(q.options)&&q.options.length>=2));
});

test('assistant system contract contains Aira-derived safety boundaries and Build Vibe knowledge',()=>{
  const system=buildAssistantSystem();
  assert.match(system,/never invent execution results/i);
  assert.match(system,/Build Vibe/i);
  assert.match(system,/3D/i);
  assert.match(system,/clarifying questions/i);
});

test('trimConversation bounds assistant history and preserves latest turns',()=>{
  const messages=Array.from({length:60},(_,i)=>({role:i%2?'user':'assistant',content:'x'.repeat(500)}));
  const trimmed=trimConversation(messages);
  assert.ok(trimmed.length<=24);
  assert.equal(trimmed.at(-1).content.length,500);
});
