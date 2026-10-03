import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {Store} from '../src/db/store.js';
import {isSuperAdmin,requireSuperAdmin,opsOverview} from '../src/ops/admin.js';
import {backupStore} from '../src/ops/backup.js';

test('super-admin allowlist is explicit and deny-by-default',()=>{
  process.env.CODINGVIBES_SUPERADMIN_EMAILS='ops@example.com,owner@example.com';
  assert.equal(isSuperAdmin('ops@example.com'),true);
  assert.equal(isSuperAdmin('OPS@EXAMPLE.COM'),true);
  assert.equal(isSuperAdmin('user@example.com'),false);
  delete process.env.CODINGVIBES_SUPERADMIN_EMAILS;
  assert.equal(isSuperAdmin('ops@example.com'),false);
});

test('control-plane audit log is user scoped and backup produces a restorable sqlite database',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cv-v10-'));
  const dbPath=path.join(dir,'codingvibes.db');
  const store=new Store(dbPath);
  const user=store.createUser('ops@example.com','hash');
  const project=store.createProject(user.id,{name:'Ops Project'});
  store.addAuditLog({actorUserId:user.id,action:'project.created',resourceType:'project',resourceId:project.id,metadata:{name:project.name}});
  assert.equal(store.listAuditLogs({actorUserId:user.id}).length,1);
  assert.equal(store.listAuditLogs({actorUserId:'other'}).length,0);
  const backup=backupStore(store,path.join(dir,'backup'));
  assert.ok(fs.existsSync(backup.path));
  const restore=new Store(backup.path);
  assert.ok(restore.getUser(user.id));
  assert.ok(restore.getProject(project.id,user.id));
  restore.close();store.close();
});

test('ops overview aggregates customer, project, deployment and run health',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cv-v10-overview-'));
  const store=new Store(path.join(dir,'db.sqlite'));
  const a=store.createUser('a@example.com','hash');
  const b=store.createUser('b@example.com','hash');
  const p=store.createProject(a.id,{name:'A'});
  const q=store.createProject(b.id,{name:'B'});
  store.createSession(a.id,p.id,'build');
  store.createSession(b.id,q.id,'build');
  assert.equal(opsOverview(store).users,2);
  assert.equal(opsOverview(store).projects,2);
  assert.equal(opsOverview(store).sessions,2);
  store.close();
});

test('super-admin request checks session identity and allowlist',()=>{
  process.env.CODINGVIBES_SUPERADMIN_EMAILS='ops@example.com';
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cv-v10-auth-'));
  const store=new Store(path.join(dir,'db.sqlite'));
  const user=store.createUser('ops@example.com','hash');
  const non=store.createUser('user@example.com','hash');
  const req=(email)=>({headers:{},_cvAdminEmail:email});
  assert.equal(requireSuperAdmin(req('ops@example.com'),store),user.id);
  assert.throws(()=>requireSuperAdmin(req('user@example.com'),store),/super_admin_required/);
  store.close();delete process.env.CODINGVIBES_SUPERADMIN_EMAILS;
});
