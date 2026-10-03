import test from 'node:test';
import assert from 'node:assert/strict';
import {createApiToken,hashApiToken,verifyApiToken} from '../src/security/api-tokens.js';
import {buildUserRouter,normalizeAiSettings,providerConnectionInput} from '../src/ai/user-router.js';

test('API tokens are one-way verifiable and never require storing the raw token', () => {
  const {token,hash,prefix}=createApiToken();
  assert.match(token,/^cv_live_[A-Za-z0-9_-]+$/);
  assert.equal(hashApiToken(token),hash);
  assert.ok(verifyApiToken(token,hash));
  assert.ok(!verifyApiToken('cv_live_invalid',hash));
  assert.match(prefix,/^cv_live_[A-Za-z0-9_-]{4,}$/);
});

test('AI settings normalize a primary provider and ordered fallback chain', () => {
  const settings=normalizeAiSettings({primary:'anthropic',chain:['anthropic','openai','anthropic','unknown'],defaultModels:{standard:'custom-model',premium:'x'}});
  assert.deepEqual(settings,{primary:'anthropic',chain:['anthropic','openai'],defaultModels:{standard:'custom-model',premium:'x'}});
});

test('user provider connection input trims credentials and only allows safe URLs', () => {
  const out=providerConnectionInput({provider:'openai',apiKey:'  secret  ',defaultModel:'  model-x  '});
  assert.deepEqual(out,{provider:'openai',apiKey:'secret',baseUrl:null,defaultModel:'model-x'});
  assert.throws(()=>providerConnectionInput({provider:'custom',apiKey:'x',baseUrl:'http://169.254.169.254'}),/unsafe_base_url/);
});

test('user router overlays user connections without exposing secrets in status', () => {
  const router=buildUserRouter({
    env:{CODINGVIBES_PROVIDER:'openai',OPENAI_API_KEY:'env-key',OPENAI_API_BASE_URL:'https://api.openai.com/v1'},
    connections:[{provider:'openai',apiKey:'user-key',baseUrl:'https://api.openai.com/v1',defaultModel:'user-model',enabled:true}],
    settings:{primary:'openai',chain:['openai'],defaultModels:{}}
  });
  const status=router.getStatus();
  assert.equal(status.provider,'openai');
  assert.equal(status.models.standard,'user-model');
  const listed=status.connectors.find(x=>x.id==='openai');
  assert.equal(listed.userConfigured,true);
  assert.equal(listed.hasSecret,true);
  assert.equal('apiKey' in listed,false);
});
