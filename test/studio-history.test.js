import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {Store} from '../src/db/store.js';
import {buildProjectHistory} from '../src/studio/history.js';

test('project chat history groups sessions, messages and runs chronologically',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'cv-history-'));
  const store=new Store(path.join(root,'db.sqlite'));
  const user=store.createUser('history@example.com','hash');
  const project=store.createProject(user.id,{name:'History'});
  const s1=store.createSession(user.id,project.id,'Homepage');
  store.addMessage(s1.id,'user','Make the hero blue',{kind:'chat'});
  store.addMessage(s1.id,'assistant','I can change the hero without rewriting the product.',{kind:'chat'});
  const s2=store.createSession(user.id,project.id,'3D room');
  store.addMessage(s2.id,'user','Add a kitchen hotspot',{kind:'chat'});
  const history=buildProjectHistory(store,project.id,user.id);
  assert.equal(history.projectId,project.id);
  assert.equal(history.sessions.length,2);
  assert.equal(history.sessions.find(x=>x.id===s1.id).messages.length,2);
  store.close();fs.rmSync(root,{recursive:true,force:true});
});
