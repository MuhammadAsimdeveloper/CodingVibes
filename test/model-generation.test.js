import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {collectProjectContext} from '../src/agent/context.js';
import {generateProjectWithModel} from '../src/agent/model-generator.js';
import {analyzeRequirements} from '../src/agent/requirements.js';

test('requirements capture high-fidelity visual intent',()=>{
  const s=analyzeRequirements('Build a futuristic immersive 3D landing page with WebGL, particles, smooth scroll animations and glassmorphism');
  assert.equal(s.styling.visual.threeD,true);
  assert.equal(s.styling.visual.animation,true);
  assert.equal(s.styling.visual.canvas,true);
  assert.equal(s.styling.visual.glass,true);
  assert.equal(s.styling.visual.style,'glass');
});

test('project context excludes sensitive files and stays bounded',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'cv-context-'));
  fs.mkdirSync(path.join(root,'src'));
  fs.writeFileSync(path.join(root,'src','app.js'),'console.log(1)');
  fs.writeFileSync(path.join(root,'.env'),'SECRET=do-not-leak');
  fs.mkdirSync(path.join(root,'.codingvibes'));
  fs.writeFileSync(path.join(root,'.codingvibes','run.json'),'internal');
  const context=collectProjectContext(root);
  assert.ok(context.files.some(x=>x.path==='src/app.js'));
  assert.ok(!context.files.some(x=>x.path==='.env'));
  assert.ok(!context.tree.some(x=>x.startsWith('.codingvibes/')));
});

test('model generator accepts a safe model file set',async()=>{
  const router={getStatus:()=>({configured:true}),stream:async({onToken})=>{const payload={summary:'Build a tailored app',files:[
    {path:'package.json',content:'{"name":"x","private":true,"type":"module","scripts":{"start":"node app/server.js","test":"node --test test/acceptance.test.js","check":"node --check app/server.js"}}'},
    {path:'app/server.js',content:'export default null;'},
    {path:'public/index.html',content:'<!doctype html><html><body>hello</body></html>'},
    {path:'public/app.js',content:'console.log("ok")'},
    {path:'public/styles.css',content:'body{margin:0}'},
    {path:'test/acceptance.test.js',content:'import test from "node:test"; test("ok",()=>{});'}
  ]};const raw=JSON.stringify(payload);for(let i=0;i<raw.length;i+=20)onToken(raw.slice(i,i+20));return{provider:'fake',model:'fake-model'};}};
  const result=await generateProjectWithModel({request:'Build a landing page',spec:analyzeRequirements('Build a landing page'),context:{tree:['README.md'],files:[{path:'README.md',content:'# app'}],truncated:false,totalBytes:5},router});
  assert.equal(result.source,'model');
  assert.equal(result.files.length,6);
});

test('model generator blocks protected paths',async()=>{
  const router={getStatus:()=>({configured:true}),stream:async({onToken})=>{onToken(JSON.stringify({summary:'bad',files:[{path:'.git/config',content:'bad'}]}));return{provider:'fake',model:'fake-model'};}};
  await assert.rejects(()=>generateProjectWithModel({request:'x',spec:analyzeRequirements('x'),context:{tree:['README.md','package.json'],files:[],truncated:false,totalBytes:0},router}),/Protected or sensitive/);
});
