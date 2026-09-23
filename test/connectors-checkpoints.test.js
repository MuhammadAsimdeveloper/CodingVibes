import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {ModelRouter} from '../src/ai/router.js';
import {createCheckpoint,restoreCheckpoint} from '../src/git/checkpoints.js';

test('OmniRoute is a first-class OpenAI-compatible connector',()=>{
  const r=new ModelRouter({CODINGVIBES_PROVIDER:'omniroute',OMNIROUTE_API_KEY:'sk_omni',CODINGVIBES_MODEL_STANDARD:'if/kimi-k2-thinking'});
  const s=r.getStatus();
  assert.equal(s.provider,'omniroute');
  assert.equal(s.configured,true);
  assert.equal(s.baseUrl,'http://127.0.0.1:20128/v1');
  assert.equal(s.models.standard,'if/kimi-k2-thinking');
  assert.ok(s.chain.includes('omniroute'));
});

test('router exposes ordered connector fallbacks without inventing credentials',()=>{
  const r=new ModelRouter({CODINGVIBES_PROVIDER:'openai',OPENAI_API_KEY:'',OMNIRoute_API_KEY:'',CODINGVIBES_PROVIDER_CHAIN:'ollama,deepseek',DEEPSEEK_API_KEY:'secret'});
  const s=r.getStatus();
  assert.equal(s.configured,true);
  assert.ok(s.chain.includes('deepseek'));
});

test('checkpoint snapshots can restore workspace state',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'cv-cp-'));
  const workspace=path.join(root,'workspace'),store=path.join(root,'checkpoints');
  fs.mkdirSync(workspace,{recursive:true});fs.writeFileSync(path.join(workspace,'app.txt'),'one');
  const cp=createCheckpoint(workspace,store,'test');
  fs.writeFileSync(path.join(workspace,'app.txt'),'two');fs.writeFileSync(path.join(workspace,'new.txt'),'extra');
  restoreCheckpoint(workspace,cp.path);
  assert.equal(fs.readFileSync(path.join(workspace,'app.txt'),'utf8'),'one');
  assert.equal(fs.existsSync(path.join(workspace,'new.txt')),false);
  fs.rmSync(root,{recursive:true,force:true});
});
