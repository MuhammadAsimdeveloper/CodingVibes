import test from 'node:test';
import assert from 'node:assert/strict';
import {buildAssistantSystem} from '../src/ai/assistant.js';

test('assistant system includes project-scoped persistent instructions when present',()=>{
  const text=buildAssistantSystem({project:{name:'Car Commerce',memory:{assistantInstructions:'Always prefer dark navy and use compact cards.'}}});
  assert.match(text,/Always prefer dark navy/);
});