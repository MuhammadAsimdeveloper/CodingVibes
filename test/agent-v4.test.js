import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {buildRepositoryIndex,searchRepositoryIndex} from '../src/agent/repository-index.js';
import {ToolRegistry} from '../src/tools/registry.js';

test('repository index captures symbols, routes and imports',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'cv-index-'));
  fs.mkdirSync(path.join(root,'src'),{recursive:true});
  fs.writeFileSync(path.join(root,'src','app.js'),"import x from './x.js'; export function dashboard(){} app.get('/dashboard',()=>{});");
  const index=buildRepositoryIndex(root);
  assert.equal(index.version,2);
  assert.ok(index.symbols.some(x=>x.name==='dashboard'));
  assert.ok(index.routes.some(x=>x.route==='/dashboard'));
  assert.ok(searchRepositoryIndex(index,'dashboard').some(x=>x.path==='src/app.js'));
});

test('precision patch replaces exact context and refuses missing context',async()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'cv-tool-'));
  fs.writeFileSync(path.join(root,'app.js'),"const answer = 1;\nconst stable = true;\n");
  const tools=new ToolRegistry({workspace:root,confirm:async()=>true});
  const ok=await tools.call('patch',{path:'app.js',oldText:'const answer = 1;',newText:'const answer = 42;'});
  assert.equal(ok.ok,true);
  assert.match(fs.readFileSync(path.join(root,'app.js'),'utf8'),/answer = 42/);
  await assert.rejects(()=>tools.call('patch',{path:'app.js',oldText:'does not exist',newText:'x'}),/Patch context not found/);
});
