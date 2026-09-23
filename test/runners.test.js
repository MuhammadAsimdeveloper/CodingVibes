import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {createIsolatedTargetRunner} from '../src/runners/isolated.js';
import {runCommand} from '../src/runners/command.js';
import {uploadArtifact} from '../src/artifacts/store.js';
import {easBuild} from '../src/runners/eas.js';
import {getTarget} from '../src/targets/registry.js';

test('native runner is fail-closed when isolation is not configured',async()=>{
  const old=process.env.CODINGVIBES_TARGET_RUNNER_MODE;delete process.env.CODINGVIBES_TARGET_RUNNER_MODE;
  const result=await createIsolatedTargetRunner({workspace:os.tmpdir(),target:getTarget('android-kotlin')});
  assert.equal(result.available,false);assert.equal(result.mode,'disabled');
  if(old===undefined)delete process.env.CODINGVIBES_TARGET_RUNNER_MODE;else process.env.CODINGVIBES_TARGET_RUNNER_MODE=old;
});

test('command runner blocks unapproved executables',async()=>{const r=await runCommand('python',['-c','print(1)']);assert.equal(r.ok,false);assert.equal(r.code,126)});

test('artifact uploader performs a real HTTP PUT with checksum',async()=>{
  const file=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'cv-art-')),'app.apk');fs.writeFileSync(file,'fake-apk');
  const server=http.createServer((req,res)=>{assert.equal(req.method,'PUT');assert.ok(req.headers['x-artifact-sha256']);let body=[];req.on('data',d=>body.push(d));req.on('end',()=>{assert.equal(Buffer.concat(body).toString(),'fake-apk');res.writeHead(200);res.end('ok')})});await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const port=server.address().port;const result=await uploadArtifact(file,{url:`http://127.0.0.1:${port}/artifact`});assert.equal(result.uploaded,true);server.close();
});

test('EAS adapter fails clearly when CLI is unavailable',async()=>{const result=await easBuild({workspace:os.tmpdir(),platform:'android',profile:'preview',timeoutMs:1000});assert.equal(result.ok,false);assert.equal(result.status,'failed');});
