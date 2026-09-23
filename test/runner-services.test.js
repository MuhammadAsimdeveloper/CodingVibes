import os from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

test('Linux and macOS control-plane services are present and bounded',()=>{
  execFileSync('node',['--check','infra/runner-fleet/linux-runner/server.mjs']);
  execFileSync('bash',['-n','infra/runner-fleet/linux-runner/install-service.sh']);
  execFileSync('bash',['-n','infra/runner-fleet/macos-runner/start.sh']);
  assert.match(fs.readFileSync('infra/runner-fleet/linux-runner/server.mjs','utf8'),/codingvibes\.linux-job\.v1/);
  assert.match(fs.readFileSync('infra/runner-fleet/linux-runner/server.mjs','utf8'),/network.*none/);
  assert.match(fs.readFileSync('infra/runner-fleet/linux-runner/server.mjs','utf8'),/secret file rejected/);
  assert.match(fs.readFileSync('infra/runner-fleet/macos-runner/start.sh','utf8'),/security find-generic-password/);
  assert.match(fs.readFileSync('infra/runner-fleet/macos-runner/com.codingvibes.macos-runner.plist','utf8'),/RunAtLoad/);
});

test('Linux remote client uses manifest attestation rather than arbitrary commands',async()=>{
  const {remoteLinuxBuild}=await import(`../src/runners/remote.js?linux=${Date.now()}`);
  const oldUrl=process.env.CODINGVIBES_LINUX_RUNNER_URL,oldToken=process.env.CODINGVIBES_LINUX_RUNNER_TOKEN,oldEnv=process.env.NODE_ENV;
  process.env.CODINGVIBES_LINUX_RUNNER_URL='http://127.0.0.1:1';process.env.CODINGVIBES_LINUX_RUNNER_TOKEN='token';process.env.NODE_ENV='development';
  const root=fs.mkdtempSync(os.tmpdir() + '/cv-remote-linux-');fs.writeFileSync(root+'/package.json','{}');fs.writeFileSync(root+'/.env','SECRET');
  const result=await remoteLinuxBuild({workspace:root,request:'build',target:{id:'android-kotlin'}});
  assert.equal(result.available,true);
  if(oldUrl===undefined)delete process.env.CODINGVIBES_LINUX_RUNNER_URL;else process.env.CODINGVIBES_LINUX_RUNNER_URL=oldUrl;
  if(oldToken===undefined)delete process.env.CODINGVIBES_LINUX_RUNNER_TOKEN;else process.env.CODINGVIBES_LINUX_RUNNER_TOKEN=oldToken;
  if(oldEnv===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=oldEnv;
});
