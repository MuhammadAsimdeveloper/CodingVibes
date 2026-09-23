import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('durable runner registry tracks heartbeat and stale state', async()=>{
  const {Store}=await import(`../src/db/store.js?persist=${Date.now()}`);
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cv-db-'));
  const store=new Store(path.join(dir,'fleet.db'));
  const runner=store.upsertRunner({id:'android-a',name:'android-a',capability:'android',labels:['codingvibes','android-builder'],metadata:{sdk:35}});
  assert.equal(runner.capability,'android');
  const beat=store.heartbeatRunner(runner.id,{status:'ready',metadata:{sdk:36}});
  assert.equal(beat.metadata.sdk,36);
  const listed=store.listRunners({staleMs:60_000});
  assert.equal(listed.length,1);assert.equal(listed[0].stale,false);
  store.close();
});

test('runner control token comparison is length-safe and constant-time compatible', async()=>{
  const old=process.env.CODINGVIBES_RUNNER_CONTROL_TOKEN;process.env.CODINGVIBES_RUNNER_CONTROL_TOKEN='abc123';
  const {validRunnerToken,normalizeRunner}=await import(`../src/runners/registry.js?token=${Date.now()}`);
  assert.equal(validRunnerToken('abc123'),true);assert.equal(validRunnerToken('a'),false);assert.equal(validRunnerToken('abc124'),false);
  const runner=normalizeRunner({id:'mac-1',name:'mac-1',capability:'macos',labels:['xcode']});assert.equal(runner.status,'ready');
  if(old===undefined)delete process.env.CODINGVIBES_RUNNER_CONTROL_TOKEN;else process.env.CODINGVIBES_RUNNER_CONTROL_TOKEN=old;
});

test('native staging excludes source-control state and secrets', async()=>{
  const {stageWorkspace}=await import(`../src/runners/isolated.js?stage=${Date.now()}`);
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'cv-stage-src-'));
  fs.mkdirSync(path.join(root,'.git'));fs.mkdirSync(path.join(root,'src'));
  fs.writeFileSync(path.join(root,'.env'),'SECRET=x');fs.writeFileSync(path.join(root,'server.pem'),'PRIVATE');fs.writeFileSync(path.join(root,'.env.example'),'PUBLIC');fs.writeFileSync(path.join(root,'src','App.kt'),'class App')
  const staged=stageWorkspace(root);
  assert.equal(fs.existsSync(path.join(staged.root,'.git')),false);
  assert.equal(fs.existsSync(path.join(staged.root,'.env')),false);
  assert.equal(fs.existsSync(path.join(staged.root,'server.pem')),false);
  assert.equal(fs.existsSync(path.join(staged.root,'.env.example')),true);
  assert.equal(fs.existsSync(path.join(staged.root,'src','App.kt')),true);
  fs.rmSync(staged.root,{recursive:true,force:true});
});

test('authoritative macOS verification requires tests and artifacts', async()=>{
  const {verifyTargetSource}=await import(`../src/targets/verify.js?macattest=${Date.now()}`);
  const target={id:'ios-swiftui',family:'ios',native:true,requiredFiles:['Package.swift','Sources/App/App.swift'],artifactTypes:['source','ipa']};
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'cv-ios-attest-'));fs.mkdirSync(path.join(root,'Sources/App'),{recursive:true});
  fs.writeFileSync(path.join(root,'Package.swift'),'// test');fs.writeFileSync(path.join(root,'Sources/App/App.swift'),'// test');
  const verified=await verifyTargetSource(root,target,{execution:{status:'verified',attested:true,tested:true,artifacts:[{path:'App.app.zip',sha256:'a'.repeat(64)}]}});
  assert.equal(verified.passed,true);
  const failed=await verifyTargetSource(root,target,{execution:{status:'verified',attested:true,tested:false,artifacts:[]}});
  assert.equal(failed.passed,false);
});
