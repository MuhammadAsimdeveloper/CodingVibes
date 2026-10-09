import test from 'node:test';import assert from 'node:assert/strict';import {deterministicAssistantReply,specialistForIntent} from '../src/ai/assistant.js';
test('assistant exposes specialist routing and a usable prompt fallback',()=>{
 assert.equal(specialistForIntent('product_3d_edit'),'3d specialist');
 const prompt=deterministicAssistantReply('give me a prompt for a 3D car ecommerce website');
 assert.match(prompt,/3D/i);assert.match(prompt,/360/i);assert.match(prompt,/products/i);assert.match(prompt,/QA/i);
});
