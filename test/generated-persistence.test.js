import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {analyzeRequirements} from '../src/agent/requirements.js';
import {generateProject,materializeProject} from '../src/agent/project-generator.js';

test('generated application data survives a server restart',async()=>{
  const base=analyzeRequirements('Build an appointment booking platform with appointments and customer login.');
  const spec={...base,dataModel:base.dataModel.some(x=>x.name==='appointments')?base.dataModel:[...base.dataModel,{name:'appointments',fields:['id','name','createdAt']}],apis:[...base.apis.filter(x=>String(x.path)!=='/api/appointments'),{method:'GET',path:'/api/appointments'},{method:'POST',path:'/api/appointments'}]};
  const writeRoute={method:'POST',path:'/api/appointments'};
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'cv-v9-persist-'));
  materializeProject(generateProject(spec),root);
  const port=4400+Math.floor(Math.random()*300);
  const env={...process.env,HOST:'127.0.0.1',PORT:String(port),CV_SESSION_SECRET:'test-session-secret-at-least-32'};
  const url='http://127.0.0.1:'+port;
  const start=()=>spawn(process.execPath,['app/server.js'],{cwd:root,env,stdio:'ignore'});
  const wait=async()=>{for(let i=0;i<120;i++){try{if((await fetch(url+'/api/health')).ok)return}catch{}await new Promise(r=>setTimeout(r,25))}throw new Error('generated preview did not start')};
  let child=start();
  try{
    await wait();
    const first=await fetch(url+writeRoute.path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:'Persistent product'})});
    assert.equal(first.status,201);
    const created=await first.json();
    assert.equal(created.data.name,'Persistent product');
  }finally{child.kill('SIGTERM');await new Promise(resolve=>child.once('exit',resolve))}
  child=start();
  try{
    await wait();
    const read=await fetch(url+writeRoute.path.replace(/^\/api\//,'/api/'));
    assert.equal(read.status,200);
    const body=await read.json();
    assert.ok(body.data.some(x=>x.name==='Persistent product'));
    assert.ok(fs.existsSync(path.join(root,'.data','records.json')));
  }finally{if(child.exitCode===null){child.kill('SIGTERM');await new Promise(resolve=>child.once('exit',resolve))}}
});
