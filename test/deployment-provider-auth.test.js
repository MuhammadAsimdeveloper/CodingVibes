import test from 'node:test';
import assert from 'node:assert/strict';
import {PROVIDERS} from '../src/deployment/providers.js';
import {authenticateProvider} from '../src/deployment/index.js';

function jsonResponse(payload,status=200){return new Response(JSON.stringify(payload),{status,headers:{'content-type':'application/json'}});}

test('connected GitHub credentials are probed read-only and never considered proof of write access',async()=>{
  const previousFetch=globalThis.fetch;
  const token='provider-secret-test-token';
  let requestedUrl='';
  let requestOptions=null;
  try{
    globalThis.fetch=async(url,options)=>{requestedUrl=String(url);requestOptions=options;return jsonResponse({login:'build-vibe-account'});};
    const result=await PROVIDERS.github.authenticate({credentials:{accessToken:token}});
    assert.equal(requestedUrl,'https://api.github.com/user');
    assert.equal(requestOptions.method,'GET');
    assert.equal(requestOptions.redirect,'error');
    assert.equal(requestOptions.headers.authorization,'Bearer '+token);
    assert.equal(result.status,'PASS');
    assert.equal(result.authenticated,true);
    assert.equal(result.writeAccessVerified,false);
    assert.doesNotMatch(JSON.stringify(result),/provider-secret-test-token|build-vibe-account/);
  }finally{globalThis.fetch=previousFetch;}
});

test('connected providers distinguish invalid credentials from service outages without exposing response bodies',async()=>{
  const previousFetch=globalThis.fetch;
  try{
    globalThis.fetch=async()=>jsonResponse({message:'private-token-from-provider-response'},403);
    const rejected=await PROVIDERS.vercel.authenticate({credentials:{accessToken:'bad-vercel-token'}});
    assert.equal(rejected.status,'BLOCKED');
    assert.equal(rejected.authenticated,false);
    assert.doesNotMatch(JSON.stringify(rejected),/private-token-from-provider-response|bad-vercel-token/);

    globalThis.fetch=async()=>jsonResponse({error:'temporarily unavailable'},503);
    const unavailable=await PROVIDERS.netlify.authenticate({credentials:{accessToken:'netlify-token'}});
    assert.equal(unavailable.status,'UNVERIFIED');
    assert.equal(unavailable.reason,undefined);
    assert.equal(unavailable.checks[0].reason,'provider_service_unavailable');
  }finally{globalThis.fetch=previousFetch;}
});

test('Cloudflare connection verification checks active token and configured account access',async()=>{
  const previousFetch=globalThis.fetch;
  const calls=[];
  try{
    globalThis.fetch=async(url,options)=>{
      calls.push(String(url));
      if(String(url).endsWith('/user/tokens/verify'))return jsonResponse({success:true,result:{status:'active'}});
      if(String(url).endsWith('/accounts/account-123'))return jsonResponse({success:true,result:{id:'account-123'}});
      throw new Error('unexpected provider request');
    };
    const result=await PROVIDERS.cloudflare.authenticate({credentials:{accessToken:'cloudflare-token',accountId:'account-123'}});
    assert.equal(result.status,'PASS');
    assert.equal(result.authenticated,true);
    assert.equal(result.writeAccessVerified,false);
    assert.equal(calls.length,2);
    const missing=await PROVIDERS.cloudflare.authenticate({credentials:{accessToken:'cloudflare-token'}});
    assert.equal(missing.status,'NOT_CONFIGURED');
    assert.equal(missing.authenticated,false);
  }finally{globalThis.fetch=previousFetch;}
});

test('Build Vibe Cloud remains unverified until its adapter exposes a documented safe probe',async()=>{
  const before={url:process.env.CODINGVIBES_HOSTING_API_URL,cloud:process.env.CODINGVIBES_CLOUD_API_URL};
  try{
    process.env.CODINGVIBES_HOSTING_API_URL='https://hosting.example.test';
    delete process.env.CODINGVIBES_CLOUD_API_URL;
    const result=await PROVIDERS['coding-vibes'].authenticate({credentials:{}});
    assert.equal(result.status,'UNVERIFIED');
    assert.equal(result.authenticated,false);
    assert.equal(result.writeAccessVerified,false);
  }finally{
    if(before.url===undefined)delete process.env.CODINGVIBES_HOSTING_API_URL;else process.env.CODINGVIBES_HOSTING_API_URL=before.url;
    if(before.cloud===undefined)delete process.env.CODINGVIBES_CLOUD_API_URL;else process.env.CODINGVIBES_CLOUD_API_URL=before.cloud;
  }
});

test('authenticateProvider never treats an unverified stored token as authenticated',async()=>{
  const store={getProviderConnection:()=>null};
  const missing=await authenticateProvider({store,userId:'user-fixture',provider:'github'});
  assert.equal(missing.status,'NOT_CONFIGURED');
  assert.equal(missing.authenticated,false);
  const manual=await authenticateProvider({store,userId:'user-fixture',provider:'manual'});
  assert.equal(manual.status,'NOT_REQUIRED');
  assert.equal(manual.authenticated,true);
});
