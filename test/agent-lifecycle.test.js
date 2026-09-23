import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {Store} from '../src/db/store.js';
import {createTaskGraph,syncTaskForEvent} from '../src/agent/task-graph.js';
import {buildRepositoryIndex} from '../src/agent/repository-index.js';

test('agent task graph persists lifecycle and skips repair after a passing verification',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cv-task-')); const store=new Store(path.join(dir,'db.sqlite'));
  store.createUser('task@example.com','hash'); const user=store.getUserByEmail('task@example.com');
  const project=store.createProject(user.id,{name:'Tasks'}); const session=store.createSession(user.id,project.id); const run=store.createRun(user.id,session.id,'build');
  createTaskGraph(store,run.id); syncTaskForEvent(store,run.id,'context_loaded',{fileCount:2}); syncTaskForEvent(store,run.id,'planned',{}); syncTaskForEvent(store,run.id,'changeset_proposed',{}); syncTaskForEvent(store,run.id,'changes_applied',{}); syncTaskForEvent(store,run.id,'verification',{passed:true});
  const tasks=store.listTasks(run.id); assert.equal(tasks.find(x=>x.key==='verification').status,'succeeded'); assert.equal(tasks.find(x=>x.key==='repair').status,'succeeded');
  store.close(); fs.rmSync(dir,{recursive:true,force:true});
});

test('repository index captures files, symbols and imports while excluding runtime noise',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cv-index-')); fs.mkdirSync(path.join(dir,'src')); fs.mkdirSync(path.join(dir,'node_modules'));
  fs.writeFileSync(path.join(dir,'src','main.js'),"import {x} from './util.js'; export function main(){ return x; }\n"); fs.writeFileSync(path.join(dir,'src','util.js'),'export const x = 42;\n'); fs.writeFileSync(path.join(dir,'node_modules','secret.js'),'export const bad=true');
  const idx=buildRepositoryIndex(dir); assert.equal(idx.fileCount,2); assert.ok(idx.symbols.some(s=>s.name==='main')); assert.ok(idx.imports.some(i=>i.specifier==='./util.js'));
  fs.rmSync(dir,{recursive:true,force:true});
});
