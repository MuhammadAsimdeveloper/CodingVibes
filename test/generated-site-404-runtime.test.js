import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { analyzeRequirements, completeSpec } from '../src/agent/requirements.js';
import { generateProject, materializeProject } from '../src/agent/project-generator.js';

test('generated server serves the custom 404 page with HTTP 404 for unknown public routes',async()=>{
  const spec=completeSpec(analyzeRequirements('Build a professional local plumbing service website with a contact form'));
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'build-vibe-generated-404-'));
  const plan=generateProject(spec);
  materializeProject(plan,root);
  const portServer=net.createServer();
  await new Promise((resolve,reject)=>{portServer.once('error',reject);portServer.listen(0,'127.0.0.1',resolve);});
  const port=portServer.address().port;
  await new Promise(resolve=>portServer.close(resolve));
  const child=spawn(process.execPath,['app/server.js'],{
    cwd:root,
    env:{...process.env,HOST:'127.0.0.1',PORT:String(port),NODE_ENV:'test',CV_SESSION_SECRET:'build-vibe-generated-site-test-secret'},
    stdio:'ignore'
  });
  try {
    let healthy=false;
    for(let attempt=0;attempt<100;attempt++){
      if(child.exitCode!==null)throw new Error('generated server exited before becoming ready');
      try {
        const response=await fetch('http://127.0.0.1:'+port+'/api/health');
        if(response.ok){healthy=true;break;}
      } catch {}
      await new Promise(resolve=>setTimeout(resolve,50));
    }
    assert.equal(healthy,true,'generated server should start');
    const home=await fetch('http://127.0.0.1:'+port+'/');
    assert.equal(home.status,200);
    const missing=await fetch('http://127.0.0.1:'+port+'/this-route-does-not-exist');
    assert.equal(missing.status,404);
    assert.match(await missing.text(),/Page not found/i);
  } finally {
    child.kill('SIGTERM');
    await Promise.race([once(child,'exit'),new Promise(resolve=>setTimeout(resolve,1000))]);
    fs.rmSync(root,{recursive:true,force:true});
  }
});
