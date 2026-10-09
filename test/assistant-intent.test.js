import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyAssistantRequest,buildClarification,buildPromptFromPlan} from '../src/assistant/intent.js';

test('natural language style edits are targeted without requiring the original prompt',()=>{
  const r=classifyAssistantRequest('make the buttons blue and the page background near black');
  assert.equal(r.mode,'modify');
  assert.equal(r.target,'design');
  assert.ok(r.operations.some(x=>x.type==='design'));
});

test('ambiguous prompts return actionable option questions',()=>{
  const r=buildClarification('make it better',{projectType:'website'});
  assert.equal(r.needsInput,true);
  assert.ok(r.options.some(x=>x.id==='visual'));
  assert.ok(r.options.some(x=>x.id==='feature'));
});

test('plan descriptions become complete reusable build prompts',()=>{
  const p=buildPromptFromPlan({idea:'premium coffee shop',genre:'hospitality',platform:'web',style:'warm editorial',features:['booking','menu']});
  assert.match(p,/coffee shop/i);
  assert.match(p,/booking/i);
  assert.match(p,/menu/i);
});
