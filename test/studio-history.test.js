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

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {Store} from '../src/db/store.js';
import {buildProjectHistory,undoLastContentEdit} from '../src/studio/history.js';

test('undo restores the previous content revision as a new draft revision',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cv-undo-'));const store=new Store(path.join(root,'db.sqlite'));
 const user=store.createUser('undo@example.com','hash');const p=store.createProject(user.id,{name:'Undo'});
 const first={version:'1.0',brand:{name:'First'}};const second={version:'1.0',brand:{name:'Second'}};
 store.upsertProjectContent(p.id,user.id,second);store.createContentRevision(p.id,user.id,first,'draft');store.createContentRevision(p.id,user.id,second,'draft');
 const restored=undoLastContentEdit(store,p.id,user.id);
 assert.equal(restored.content.brand.name,'First');assert.equal(restored.revision.status,'draft');
 store.close();fs.rmSync(root,{recursive:true,force:true});
});
