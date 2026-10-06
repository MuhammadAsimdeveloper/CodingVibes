import test from 'node:test';
import assert from 'node:assert/strict';
import {assessDeploymentPreflight} from '../src/deployment/preflight.js';
import {createDeploymentAttestation,verifyDeploymentAttestation} from '../src/deployment/attestation.js';

test('deployment preflight distinguishes not configured from configured provider blockers',()=>{
  const none=assessDeploymentPreflight({provider:'',targetId:'web-node',env:{}});
  assert.equal(none.status,'NOT_CONFIGURED');
  const manual=assessDeploymentPreflight({provider:'manual',targetId:'web-node',env:{}});
  assert.equal(manual.status,'PASS');
  const github=assessDeploymentPreflight({provider:'github',targetId:'web-node',env:{}});
  assert.equal(github.status,'BLOCKED');
  assert.ok(github.blockers.includes('github_access_token_missing'));
});

test('native deployment preflight remains explicit when host toolchain is absent',()=>{
  const result=assessDeploymentPreflight({provider:'manual',targetId:'ios-swiftui',env:{PATH:''}});
  assert.equal(result.status,'BLOCKED');
  assert.ok(result.blockers.some(x=>x.includes('swift')||x.includes('xcode')));
});

test('deployment attestation is tamper-detectable and reports unsigned state honestly',()=>{
  const base={version:'12.2.0',commitSha:'abc123',targetId:'web-node',artifactFingerprint:'f'.repeat(64),verification:{passed:true,scope:'source+runtime'}};
  const signed=createDeploymentAttestation(base,{secret:'test-secret'});
  assert.equal(signed.status,'SIGNED');
  assert.match(signed.signature,/^[a-f0-9]{64}$/);
  assert.equal(verifyDeploymentAttestation(signed,{secret:'test-secret'}),true);
  assert.equal(verifyDeploymentAttestation({...signed,artifactFingerprint:'e'.repeat(64)},{secret:'test-secret'}),false);
  const unsigned=createDeploymentAttestation(base,{secret:''});
  assert.equal(unsigned.status,'UNSIGNED');
  assert.equal(unsigned.signature,null);
});
