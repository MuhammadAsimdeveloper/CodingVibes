import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {Store} from '../src/db/store.js';
import {encryptSecret} from '../src/security/vault.js';
import {createApiToken} from '../src/security/api-tokens.js';

test('store persists per-user AI settings, encrypted provider records, and hashed gateway tokens',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cv-ai-'));
  const db=path.join(dir,'test.db');
  const previous=process.env.DATABASE_PATH;process.env.DATABASE_PATH=db;
  try{
    const store=new Store(db);
    const user=store.createUser('ai@example.com','hash');
    const secret=encryptSecret(JSON.stringify({apiKey:'secret-key',baseUrl:'https://api.example.com/v1'}));
    store.upsertProviderConnection(user.id,'openai',secret,{defaultModel:'model-a',enabled:true});
    assert.equal(store.listProviderConnections(user.id)[0].provider,'openai');
    assert.equal('secret_ciphertext' in store.listProviderConnections(user.id)[0],false);
    const secure=store.getProviderConnectionSecret(user.id,'openai');
    assert.match(secure.secret_ciphertext,/^[A-Za-z0-9_-]+$/);
    assert.equal(store.updateAiSettings(user.id,{primary:'openai',chain:['openai','deepseek'],defaultModels:{standard:'model-a'}}).chain.length,2);
    const created=createApiToken();
    const saved=store.createApiToken(user.id,{name:'Plugin',hash:created.hash,prefix:created.prefix});
    assert.equal(store.findActiveApiTokenByHash(created.hash).id,saved.id);
    assert.equal(store.listApiTokens(user.id)[0].token_prefix,created.prefix);
    assert.equal(store.revokeApiToken(saved.id,user.id).revoked_at!==null,true);
    store.close();
  } finally {if(previous===undefined)delete process.env.DATABASE_PATH;else process.env.DATABASE_PATH=previous;fs.rmSync(dir,{recursive:true,force:true});}
});
