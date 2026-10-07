import test from 'node:test';import assert from 'node:assert/strict';import {ModelRouter} from '../src/ai/router.js';
test('local Aira-compatible backends use local model settings instead of cloud defaults',()=>{
 const r=new ModelRouter({CODINGVIBES_PROVIDER:'llama-cpp',CODINGVIBES_MODEL_LOCAL:'aira-local.gguf',CODINGVIBES_LLAMA_CPP_BASE_URL:'http://127.0.0.1:8080/v1'});
 assert.equal(r.resolveModel('standard','llama-cpp'),'aira-local.gguf');
 assert.equal(r.resolveProvider('llama-cpp').configured,true);
});
