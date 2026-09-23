import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

test('runner fleet provisioning assets are syntactically valid and fail-closed on credentials',()=>{
  for(const file of ['infra/runner-fleet/provision-linux.sh','infra/runner-fleet/provision-macos.sh','infra/runner-fleet/device-smoke.sh','infra/runner-fleet/healthcheck.sh']){
    execFileSync('bash',['-n',file]);
    assert.equal(fs.existsSync(file),true);
  }
  assert.match(fs.readFileSync('infra/runner-fleet/docker-compose.yml','utf8'),/network_mode: none/);
  assert.match(fs.readFileSync('infra/runner-fleet/macos-runner/server.mjs','utf8'),/codingvibes\.macos-job\.v3/);
});

test('Android manifest metadata can be discovered for device smoke',async()=>{
  const {detectAndroidApp}=await import('../src/runners/index.js');
  const dir=fs.mkdtempSync('/tmp/cv-android-');fs.mkdirSync(`${dir}/app/src/main`,{recursive:true});
  fs.writeFileSync(`${dir}/app/src/main/AndroidManifest.xml`,'<manifest package="com.example.app"><application><activity android:name=".MainActivity"/></application></manifest>');
  const result=detectAndroidApp(dir);assert.equal(result.packageId,'com.example.app');assert.equal(result.activity,'com.example.app.MainActivity');
});


test('fleet security contract is explicit and versioned',async()=>{
  const {fleetManifest,makeJobEnvelope}=await import('../src/runners/fleet.js');
  const manifest=fleetManifest();
  assert.equal(manifest.version,'3.0.0');
  assert.equal(manifest.security.buildNetwork,'none');
  assert.equal(manifest.security.dependencyNetwork,'named-controlled-egress-only');
  assert.equal(manifest.security.macosAuth,'required');
  assert.equal(manifest.security.macosFixedCommandProfiles,true);
  assert.equal(manifest.security.artifactSha256,true);
  assert.equal(manifest.security.artifactUploadTimeout,true);
  const job=makeJobEnvelope({target:'android-kotlin',phase:'dependencies',request:'hello'});
  assert.equal(job.schema,'codingvibes.runner-job.v2');
  assert.equal(job.target,'android-kotlin');
  assert.match(job.requestHash,/^[a-f0-9]{64}$/);
});

test('artifact store rejects workspace escape and preserves sha256',async()=>{
  const {copyArtifacts,artifactManifest}=await import('../src/artifacts/store.js');
  const root=fs.mkdtempSync('/tmp/cv-artifacts-');const out=fs.mkdtempSync('/tmp/cv-out-');
  fs.writeFileSync(`${root}/app.apk`,'apk');
  assert.throws(()=>copyArtifacts(root,out,[{path:'../secret.apk'}],'run'));
  const result=copyArtifacts(root,out,[{path:'app.apk',size:3,sha256:'bad'}],'run');
  assert.equal(result[0].sha256.length,64);
  assert.equal(artifactManifest(result).artifacts[0].sha256,result[0].sha256);
});
