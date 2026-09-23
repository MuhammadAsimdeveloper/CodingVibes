import test from 'node:test';
import assert from 'node:assert/strict';
import {ModelRouter} from '../src/ai/router.js';

test('router supports local and free-compatible profiles without inventing credentials',()=>{const ollama=new ModelRouter({CODINGVIBES_PROVIDER:'ollama',CODINGVIBES_MODEL_STANDARD:'qwen3-coder'});assert.equal(ollama.getStatus().configured,true);assert.equal(ollama.getStatus().baseUrl,'http://127.0.0.1:11434/v1');const openrouter=new ModelRouter({CODINGVIBES_PROVIDER:'openrouter',CODINGVIBES_API_KEY:'x',CODINGVIBES_MODEL_STANDARD:'openrouter/free'});assert.equal(openrouter.getStatus().provider,'openrouter');assert.equal(openrouter.getStatus().models.standard,'openrouter/free');});

test('anthropic provider uses native Messages API streaming semantics',async()=>{
  const original=globalThis.fetch;
  const calls=[];
  globalThis.fetch=async(url,options)=>{
    calls.push({url,options});
    const body=[
      'event: message_start\n',
      'data: {"type":"message_start"}\n\n',
      'event: content_block_delta\n',
      'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"hello"}}\n\n',
      'event: message_stop\n',
      'data: {"type":"message_stop"}\n\n'
    ].join('');
    return new Response(body,{status:200,headers:{'content-type':'text/event-stream'}});
  };
  try{
    const router=new ModelRouter({CODINGVIBES_PROVIDER:'anthropic',ANTHROPIC_API_KEY:'secret',CODINGVIBES_MODEL_STANDARD:'claude-sonnet-5'});
    let text='';const out=await router.stream({system:'system',user:'hello',onToken:t=>text+=t});
    assert.equal(out.provider,'anthropic');assert.equal(text,'hello');assert.equal(calls[0].url,'https://api.anthropic.com/v1/messages');
    assert.equal(calls[0].options.headers['x-api-key'],'secret');assert.equal(calls[0].options.headers['anthropic-version'],'2023-06-01');
    const sent=JSON.parse(calls[0].options.body);assert.equal(sent.model,'claude-sonnet-5');assert.equal(sent.system,'system');assert.equal(sent.stream,true);assert.equal('temperature' in sent,false);
  }finally{globalThis.fetch=original;}
});
