import test from 'node:test';
import assert from 'node:assert/strict';
import {answerBuildVibeQuestion,createLocalAssistantConfig} from '../src/assistant/runtime.js';

test('coding assistant answers Build Vibe product questions from local knowledge',()=>{
  const r=answerBuildVibeQuestion('How do I change the color of my project?',{section:'studio'});
  assert.equal(r.mode,'help');
  assert.ok(r.reply.length>30);
  assert.ok(r.actions.some(x=>x.type==='modify'));
});

test('assistant creates actionable prompts from product ideas',()=>{
  const r=answerBuildVibeQuestion('I want a 3D furniture store with a product viewer',{section:'studio'});
  assert.equal(r.mode,'prompt');
  assert.match(r.prompt,/3D|3d/);
  assert.match(r.prompt,/furniture/i);
});

test('local assistant configuration fails closed without a model or executable',()=>{
  const c=createLocalAssistantConfig({modelPath:'',executable:'',enabled:true});
  assert.equal(c.available,false);
});
