import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyDeploymentCredential} from '../src/deployment/credential-check.js';

function jsonResponse(payload,status=200){return new Response(JSON.stringify(payload),{status,headers:{'content-type':'application/json'}});}

test('credential check reports unconfigured providers without network calls or secret values',async()=>{
  let called=false;
  const result=await verifyDeploymentCredential('github',{env:{},fetchImpl:async()=>{called=true;throw new Error('must not request')}});
  assert.equal(result.status,'NOT_CONFIGURED');
  assert.deepEqual(result.blockers,['credential_missing:GITHUB_TOKEN']);
  assert.equal(called,false);
  assert.deepEqual(result.credentialVariables,['GITHUB_TOKEN']);
  assert.ok(!JSON.stringify(result).includes('test-secret-token-value'));
});

test('GitHub credential probe confirms token authentication but does not claim write access',async()=>{
  const token='test-secret-token-value';
  let endpoint='';
  const result=await verifyDeploymentCredential('github',{
    env:{GITHUB_TOKEN:token},
    fetchImpl:async(url,options)=>{endpoint=String(url);assert.equal(options.headers.authorization,'Bearer '+token);return jsonResponse({login:'build-vibe-test'});}
  });
  assert.equal(endpoint,'https://api.github.com/user');
  assert.equal(result.status,'PASS');
  assert.equal(result.writeAccessVerified,false);
  assert.equal(result.checks[0].reason,'authenticated_identity_confirmed');
  assert.doesNotMatch(JSON.stringify(result),new RegExp(token));
});

test('credential probe distinguishes rejected credentials from provider outages',async()=>{
  const rejected=await verifyDeploymentCredential('vercel',{
    env:{VERCEL_TOKEN:'bad-token'},
    fetchImpl:async()=>jsonResponse({error:{message:'bad-token'}},403)
  });
  assert.equal(rejected.status,'BLOCKED');
  assert.equal(rejected.checks[0].reason,'credential_rejected_or_permissions_insufficient');
  assert.doesNotMatch(JSON.stringify(rejected),/bad-token/);

  const outage=await verifyDeploymentCredential('netlify',{
    env:{NETLIFY_AUTH_TOKEN:'token'},
    fetchImpl:async()=>jsonResponse({message:'temporarily unavailable'},503)
  });
  assert.equal(outage.status,'UNVERIFIED');
  assert.equal(outage.checks[0].reason,'provider_service_unavailable');
});

test('Cloudflare credential probe requires active token and access to the configured account',async()=>{
  const calls=[];
  const result=await verifyDeploymentCredential('cloudflare',{
    env:{CLOUDFLARE_API_TOKEN:'cf-token',CLOUDFLARE_ACCOUNT_ID:'account-123'},
    fetchImpl:async(url,options)=>{
      calls.push({url:String(url),authorization:options.headers.authorization});
      if(String(url).endsWith('/user/tokens/verify'))return jsonResponse({success:true,result:{status:'active'}});
      if(String(url).endsWith('/accounts/account-123'))return jsonResponse({success:true,result:{id:'account-123',name:'Fixture'}});
      throw new Error('unexpected URL');
    }
  });
  assert.equal(result.status,'PASS');
  assert.equal(calls.length,2);
  assert.ok(calls.every(call=>call.authorization==='Bearer cf-token'));
  assert.deepEqual(result.checks.map(check=>check.name),['token_status','account_access']);
  assert.equal(result.writeAccessVerified,false);

  let accountRequested=false;
  const inactive=await verifyDeploymentCredential('cloudflare',{
    env:{CLOUDFLARE_API_TOKEN:'expired',CLOUDFLARE_ACCOUNT_ID:'account-123'},
    fetchImpl:async()=>{accountRequested=true;return jsonResponse({success:true,result:{status:'inactive'}});}
  });
  assert.equal(inactive.status,'BLOCKED');
  assert.equal(accountRequested,false);
});

test('Build Vibe Cloud probe never claims credential verification without a documented safe health endpoint',async()=>{
  const missing=await verifyDeploymentCredential('coding-vibes',{env:{}});
  assert.equal(missing.status,'NOT_CONFIGURED');
  const invalid=await verifyDeploymentCredential('coding-vibes',{env:{CODINGVIBES_HOSTING_API_URL:'http://deploy.example.com'}});
  assert.equal(invalid.status,'BLOCKED');
  const uncertain=await verifyDeploymentCredential('coding-vibes',{env:{CODINGVIBES_HOSTING_API_URL:'https://deploy.example.com'}});
  assert.equal(uncertain.status,'UNVERIFIED');
  assert.ok(uncertain.warnings.includes('hosting_adapter_has_no_documented_non_mutating_credential_probe'));
});

test('manual export requires no provider credential and unsupported providers are blocked',async()=>{
  assert.equal((await verifyDeploymentCredential('manual',{env:{}})).status,'NOT_REQUIRED');
  const unknown=await verifyDeploymentCredential('provider-does-not-exist',{env:{}});
  assert.equal(unknown.status,'BLOCKED');
  assert.deepEqual(unknown.blockers,['unsupported_deployment_provider']);
});
