import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {InMemoryJobQueue} from '../src/jobs/queue.js';
import {Store} from '../src/db/store.js';
import {backupStore} from '../src/ops/backup.js';
import {scaleOutConfig} from '../src/platform/scaleout.js';
import {RequestTelemetry} from '../src/ops/telemetry.js';

test('in-memory queue provides idempotency and dead-letter capture without weakening retries',async()=>{
  const queue=new InMemoryJobQueue();
  const first=await queue.enqueue({type:'build',payload:{runId:'r1'},idempotencyKey:'r1'});
  const second=await queue.enqueue({type:'build',payload:{runId:'r1'},idempotencyKey:'r1'});
  assert.equal(first.id,second.id);
  const [reserved]=await queue.reserve();
  assert.equal(reserved.id,first.id);
  const failed=await queue.fail(reserved,{retry:true,maxAttempts:2,error:'boom'});
  assert.equal(failed.requeued,true);
  const [retry]=await queue.reserve();
  const dead=await queue.fail(retry,{retry:true,maxAttempts:2,error:'boom-again'});
  assert.equal(dead.requeued,undefined);
  assert.equal(dead.deadLettered,true);
  assert.equal(queue.deadLetters.length,1);
  assert.equal(queue.deadLetters[0].lastError,'boom-again');
});

test('scale-out doctor remains explicit about managed infrastructure state',()=>{
  const postgres=scaleOutConfig({
    CODINGVIBES_DB_BACKEND:'postgres',
    CODINGVIBES_OBJECT_BACKEND:'s3',
    CODINGVIBES_QUEUE_BACKEND:'redis'
  });
  assert.equal(postgres.ready,false);
  assert.ok(postgres.blockers.includes('postgres_database_not_configured'));
  assert.ok(postgres.blockers.includes('s3_object_bucket_missing'));
  assert.ok(postgres.blockers.includes('redis_queue_url_missing'));
});

test('database backup is restorable and content survives the copy boundary',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'build-vibe-backup-'));
  const dbPath=path.join(dir,'db.sqlite'),backupRoot=path.join(dir,'backups');
  const store=new Store(dbPath);
  try{
    const user=store.createUser('backup@example.com','hash');
    const project=store.createProject(user.id,{name:'Restore Me'});
    const backup=backupStore(store,backupRoot);
    assert.ok(fs.existsSync(backup.path));
    assert.match(backup.sha256,/^[a-f0-9]{64}$/);
    store.createProject(user.id,{name:'Post Backup'});
    const restoredPath=path.join(dir,'restored.sqlite');
    fs.copyFileSync(backup.path,restoredPath);
    const restored=new Store(restoredPath);
    try{
      assert.ok(restored.getProject(project.id,user.id));
      assert.equal(restored.listProjects(user.id).length,1);
      assert.equal(restored.healthcheck(),true);
    }finally{restored.close();}
  }finally{store.close();fs.rmSync(dir,{recursive:true,force:true});}
});


test('request telemetry exposes bounded error rate and p95 latency',()=>{
  const t=new RequestTelemetry({maxRoutes:4});
  t.record({method:'GET',path:'/health',status:200,durationMs:10});
  t.record({method:'GET',path:'/health',status:200,durationMs:20});
  t.record({method:'POST',path:'/api/build',status:503,durationMs:100});
  const s=t.snapshot();
  assert.equal(s.requests.total,3);
  assert.equal(s.requests.errors,1);
  assert.equal(s.requests.errorRate,0.3333);
  assert.equal(s.latency.p95Ms,100);
  assert.equal(s.routes[0].p95DurationMs,20);
});
