import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';


test('docker dependency network policy rejects host and bridge', async()=>{
  const original=process.env.CODINGVIBES_TARGET_RUNNER_MODE;
  process.env.CODINGVIBES_TARGET_RUNNER_MODE='docker';
  const mod=await import(`../src/runners/isolated.js?policy=${Date.now()}`);
  const target={id:'android-kotlin',family:'android'};
  const oldNet=process.env.CODINGVIBES_DEPENDENCY_NETWORK;
  process.env.CODINGVIBES_DEPENDENCY_NETWORK='host';
  const runner=await mod.createIsolatedTargetRunner({workspace:os.tmpdir(),target});
  if(runner.available){const result=await runner.runNetwork('gradle',['dependencies']);assert.equal(result.code,78);}
  if(oldNet===undefined)delete process.env.CODINGVIBES_DEPENDENCY_NETWORK;else process.env.CODINGVIBES_DEPENDENCY_NETWORK=oldNet;
  if(original===undefined)delete process.env.CODINGVIBES_TARGET_RUNNER_MODE;else process.env.CODINGVIBES_TARGET_RUNNER_MODE=original;
});

test('command environment does not inherit API secrets by default', async()=>{
  const {runCommand}=await import(`../src/runners/command.js?env=${Date.now()}`);
  const old=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='should-not-leak';
  const result=await runCommand('node',['-e','process.stdout.write(process.env.OPENAI_API_KEY||"missing")']);
  assert.equal(result.stdout,'missing');
  if(old===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=old;
});

test('runner scheduler bounds leases and times out waiters', async()=>{
  const {RunnerLeaseManager}=await import(`../src/runners/scheduler.js?sched=${Date.now()}`);
  const old=process.env.CODINGVIBES_RUNNER_CONCURRENCY_ANDROID;process.env.CODINGVIBES_RUNNER_CONCURRENCY_ANDROID='1';
  const manager=new RunnerLeaseManager();
  const first=await manager.acquire({capability:'android',runId:'1',target:'android-kotlin'});
  const waiting=manager.acquire({capability:'android',runId:'2',target:'android-kotlin',timeoutMs:20});
  await assert.rejects(waiting,e=>e.code==='RUNNER_LEASE_TIMEOUT');
  first.release();
  assert.equal(manager.snapshot().android.active,0);
  if(old===undefined)delete process.env.CODINGVIBES_RUNNER_CONCURRENCY_ANDROID;else process.env.CODINGVIBES_RUNNER_CONCURRENCY_ANDROID=old;
});

test('dependency cache key changes when lockfile changes', async()=>{
  const {dependencyCacheKey,cacheVolumeName}=await import(`../src/runners/cache.js?cache=${Date.now()}`);
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'cv-cache-'));
  fs.writeFileSync(path.join(root,'package.json'),'{}');
  fs.writeFileSync(path.join(root,'package-lock.json'),'one');
  const a=dependencyCacheKey(root,{targetId:'mobile-expo',runnerImage:'img',toolchainVersion:'v1'});
  fs.writeFileSync(path.join(root,'package-lock.json'),'two');
  const b=dependencyCacheKey(root,{targetId:'mobile-expo',runnerImage:'img',toolchainVersion:'v1'});
  assert.notEqual(a,b);assert.match(cacheVolumeName({targetId:'mobile-expo',key:b}),/^codingvibes-cache-mobile-expo-/);
});

test('macOS runner protocol source contains fixed job validation', async()=>{
  const text=fs.readFileSync('infra/runner-fleet/macos-runner/server.mjs','utf8');
  assert.match(text,/codingvibes\.macos-job\.v3/);
  assert.match(text,/workspace manifest mismatch/);
  assert.match(text,/findXcodeProject/);
  assert.doesNotMatch(text,/const ALLOWED=.*commands/);
});

test('authoritative isolated execution prevents duplicate native rebuilds', async()=>{
  const {verifyTargetSource}=await import(`../src/targets/verify.js?attest=${Date.now()}`);
  const target={id:'ios-swiftui',family:'ios',native:true,requiredFiles:['Package.swift','Sources/App/App.swift'],artifactTypes:['source','ipa']};
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'cv-ios-'));fs.mkdirSync(path.join(root,'Sources/App'),{recursive:true});
  fs.writeFileSync(path.join(root,'Package.swift'),'// test');fs.writeFileSync(path.join(root,'Sources/App/App.swift'),'// test');
  const result=await verifyTargetSource(root,target,{execution:{status:'built',attested:true,tested:true,artifacts:[{path:'App.app.zip',sha256:'a'.repeat(64)}]}});
  assert.equal(result.passed,true);
  assert.deepEqual(result.commands,[]);
});

test('fleet status reports unsafe dependency network and production image posture', async()=>{
  const {fleetStatus}=await import(`../src/runners/status.js?status=${Date.now()}`);
  const oldMode=process.env.CODINGVIBES_TARGET_RUNNER_MODE,oldNet=process.env.CODINGVIBES_DEPENDENCY_NETWORK,oldEnv=process.env.NODE_ENV;
  process.env.CODINGVIBES_TARGET_RUNNER_MODE='docker';process.env.CODINGVIBES_DEPENDENCY_NETWORK='host';process.env.NODE_ENV='production';
  const result=fleetStatus();
  assert.equal(result.mode,'docker');assert.equal(result.network.safe,false);assert.equal(result.security.pinnedImagesRequired,true);
  if(oldMode===undefined)delete process.env.CODINGVIBES_TARGET_RUNNER_MODE;else process.env.CODINGVIBES_TARGET_RUNNER_MODE=oldMode;
  if(oldNet===undefined)delete process.env.CODINGVIBES_DEPENDENCY_NETWORK;else process.env.CODINGVIBES_DEPENDENCY_NETWORK=oldNet;
  if(oldEnv===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=oldEnv;
});
