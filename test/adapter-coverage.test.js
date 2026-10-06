import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {runnerControlConfigured,validRunnerToken,requireRunnerToken,normalizeRunner} from '../src/runners/registry.js';
import {oauthConfigured,beginOAuth,completeOAuth} from '../src/deployment/oauth.js';
import {getProvider,listProviders,PROVIDERS} from '../src/deployment/providers.js';
import {normalizeVideoRequest,createVideoTask,getVideoTask,downloadVideo} from '../src/media/runway.js';

test('runner registry validates control credentials and payloads',()=>{
  const previous=process.env.CODINGVIBES_RUNNER_CONTROL_TOKEN;
  try{
    process.env.CODINGVIBES_RUNNER_CONTROL_TOKEN='runner-secret';
    assert.equal(runnerControlConfigured(),true);
    assert.equal(validRunnerToken('runner-secret'),true);
    assert.equal(validRunnerToken('wrong'),false);
    assert.equal(requireRunnerToken('runner-secret'),true);
    assert.throws(()=>requireRunnerToken('wrong'),/runner control token required/);
    const runner=normalizeRunner({id:'runner-1',name:'Runner One',capability:'web',labels:['linux','x:y'],metadata:{region:'test'},status:'draining'});
    assert.equal(runner.status,'draining');
    assert.deepEqual(runner.labels,['linux','x:y']);
    assert.throws(()=>normalizeRunner({id:'bad id',name:'Runner',capability:'web'}),/invalid runner id/);
    assert.throws(()=>normalizeRunner({id:'ok',name:'Runner',capability:'BAD'}),/invalid runner capability/);
  }finally{if(previous===undefined)delete process.env.CODINGVIBES_RUNNER_CONTROL_TOKEN;else process.env.CODINGVIBES_RUNNER_CONTROL_TOKEN=previous;}
});

test('deployment OAuth helpers build PKCE state and complete a mocked token exchange',async()=>{
  const previous={GITHUB_CLIENT_ID:process.env.GITHUB_CLIENT_ID,GITHUB_CLIENT_SECRET:process.env.GITHUB_CLIENT_SECRET,GITHUB_REDIRECT_URI:process.env.GITHUB_REDIRECT_URI};
  try{
    process.env.GITHUB_CLIENT_ID='client';
    process.env.GITHUB_CLIENT_SECRET='secret';
    process.env.GITHUB_REDIRECT_URI='https://app.example.test/oauth/github';
    assert.equal(oauthConfigured('github'),true);
    assert.equal(oauthConfigured('unknown'),false);
    const states=[];
    const store={
      createOAuthState(userId,provider,state,expiresAt,metadata){states.push({userId,provider,state,expiresAt,metadata});},
      consumeOAuthState(provider,state){const row=states.find(x=>x.provider===provider&&x.state===state);return row?{provider,user_id:row.userId,metadata:row.metadata}:null;}
    };
    const url=beginOAuth(store,'github',{userId:'user-1',redirectAfter:'/app'});
    assert.match(url,/code_challenge=/);
    assert.match(url,/client_id=client/);
    const originalFetch=globalThis.fetch;
    try{
      globalThis.fetch=async()=>new Response(JSON.stringify({access_token:'gh-token',refresh_token:'refresh'}),{status:200});
      const done=await completeOAuth(store,'github',{code:'abc',state:states[0].state});
      assert.equal(done.secret.includes('gh-token'),true);
      assert.equal(done.metadata.refreshTokenPresent,true);
      assert.equal(done.redirectAfter,'/app');
    }finally{globalThis.fetch=originalFetch;}
    await assert.rejects(completeOAuth(store,'github',{code:'abc',state:'missing'}),/oauth_state_invalid/);
  }finally{
    for(const [k,v] of Object.entries(previous)){if(v===undefined)delete process.env[k];else process.env[k]=v;}
  }
});

test('deployment registry exposes adapters and each external adapter fails closed without credentials',async()=>{
  const ids=listProviders().map(x=>x.id);
  assert.ok(ids.includes('github')&&ids.includes('vercel')&&ids.includes('netlify')&&ids.includes('cloudflare')&&ids.includes('hostinger')&&ids.includes('manual'));
  assert.equal(getProvider('VERCEL').id,'vercel');
  const artifact={root:fs.mkdtempSync(path.join(os.tmpdir(),'bv-artifact-')),files:[],projectMetadata:{name:'Coverage Test'},framework:'static-html',deploymentMetadata:{serverRequired:false}};
  try{
    for(const id of ['github','vercel','netlify','cloudflare','hostinger']){
      await assert.rejects(PROVIDERS[id].deploy({artifact,credentials:{},options:{}}),/not_connected/);
    }
    const r=await PROVIDERS.manual.status({deploymentId:'/tmp/test.zip'});
    assert.equal(r.status,'ready');
  }finally{fs.rmSync(artifact.root,{recursive:true,force:true});}
});

test('Runway request validation and provider calls handle success and API failures',async()=>{
  assert.deepEqual(normalizeVideoRequest({prompt:'A clean product animation',duration:5,ratio:'1280:720',model:'gen4_turbo'}),{prompt:'A clean product animation',duration:5,ratio:'1280:720',model:'gen4_turbo'});
  assert.throws(()=>normalizeVideoRequest({prompt:''}),/video_prompt_required/);
  assert.throws(()=>normalizeVideoRequest({prompt:'x'.repeat(5001)}),/video_prompt_too_long/);
  assert.throws(()=>normalizeVideoRequest({prompt:'x',duration:1}),/video_duration_must_be_5_or_10/);
  const previous=process.env.RUNWAYML_API_SECRET;process.env.RUNWAYML_API_SECRET='test-runway-key';
  const originalFetch=globalThis.fetch;
  try{
    globalThis.fetch=async(url,options={})=>{
      if(String(url).includes('/text_to_video'))return new Response(JSON.stringify({id:'task_123'}),{status:200});
      if(String(url).includes('/tasks/'))return new Response(JSON.stringify({status:'succeeded',output:['https://cdn.example.test/video.mp4']}),{status:200});
      return new Response(new Uint8Array([1,2,3]),{status:200,headers:{'content-length':'3'}});
    };
    const task=await createVideoTask({prompt:'test',duration:5,ratio:'1280:720',model:'gen4_turbo'});assert.equal(task.taskId,'task_123');
    const state=await getVideoTask('task_123');assert.equal(state.status,'SUCCEEDED');
    const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bv-video-'));const out=path.join(dir,'video.mp4');const result=await downloadVideo('https://cdn.example.test/video.mp4',out);assert.equal(result.size,3);assert.equal(fs.readFileSync(out).length,3);fs.rmSync(dir,{recursive:true,force:true});
    globalThis.fetch=async()=>new Response(JSON.stringify({error:'bad'}),{status:400});
    await assert.rejects(createVideoTask({prompt:'test'}),/bad/);
    globalThis.fetch=async()=>new Response(JSON.stringify({error:'bad'}),{status:500});
    await assert.rejects(getVideoTask('task_123'),/bad/);
  }finally{globalThis.fetch=originalFetch;if(previous===undefined)delete process.env.RUNWAYML_API_SECRET;else process.env.RUNWAYML_API_SECRET=previous;}
});
