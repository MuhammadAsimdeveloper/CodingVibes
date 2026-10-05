import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('backend runtime initializes local services and reports their health',async()=>{
  const {BackendRuntime}=await import('../src/backend/runtime.js?local-backend');
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'build-vibe-backend-'));
  const runtime=new BackendRuntime({
    env:{
      NODE_ENV:'development',
      CODINGVIBES_DB_BACKEND:'sqlite',
      CODINGVIBES_OBJECT_BACKEND:'local',
      CODINGVIBES_QUEUE_BACKEND:'local',
      CODINGVIBES_OBJECT_ROOT:path.join(root,'objects'),
    }
  });
  await runtime.init();
  const health=await runtime.healthcheck();
  const status=await runtime.status();
  assert.equal(health.ok,true);
  assert.equal(status.database.backend,'sqlite');
  assert.equal(status.objectStorage.backend,'local');
  assert.equal(status.queue.backend,'local');
  await runtime.close();
});

test('backend runtime persists an object reference and supports durable queue dispatch',async()=>{
  const {BackendRuntime}=await import('../src/backend/runtime.js?durable-backend');
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'build-vibe-backend-'));
  const runtime=new BackendRuntime({
    env:{
      NODE_ENV:'development',
      CODINGVIBES_DB_BACKEND:'sqlite',
      CODINGVIBES_OBJECT_BACKEND:'local',
      CODINGVIBES_QUEUE_BACKEND:'local',
      CODINGVIBES_OBJECT_ROOT:path.join(root,'objects'),
    }
  });
  await runtime.init();
  const object=await runtime.putObject({key:'projects/p1/build.zip',body:'artifact',contentType:'application/zip'});
  assert.equal(object.size,8);
  assert.equal(object.sha256.length,64);
  const loaded=await runtime.getObject({key:object.key});
  assert.equal(loaded.body.toString(),'artifact');
  const job=await runtime.enqueue({type:'build.verify',payload:{projectId:'p1',runId:'r1'}});
  const reserved=await runtime.queue.reserve({blockMs:0});
  assert.equal(reserved[0].id,job.id);
  await runtime.queue.ack(reserved[0].streamId);
  await runtime.close();
});

test('backend runtime fails closed on unsupported production backend configuration',async()=>{
  const {BackendRuntime}=await import('../src/backend/runtime.js?invalid-backend');
  await assert.rejects(
    ()=>new BackendRuntime({env:{NODE_ENV:'production',CODINGVIBES_DB_BACKEND:'redis'}}).init(),
    error=>String(error?.message||'').includes('unsupported_database_backend')
  );
});

test('backend runtime can audit to the local store without exposing secrets',async()=>{
  const {BackendRuntime}=await import('../src/backend/runtime.js?audit-backend');
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'build-vibe-backend-'));
  const runtime=new BackendRuntime({
    env:{
      NODE_ENV:'development',
      DATABASE_PATH:path.join(root,'app.db'),
      CODINGVIBES_DB_BACKEND:'sqlite',
      CODINGVIBES_OBJECT_BACKEND:'local',
      CODINGVIBES_QUEUE_BACKEND:'local',
      CODINGVIBES_OBJECT_ROOT:path.join(root,'objects'),
    }
  });
  await runtime.init();
  const user=runtime.store.createUser('backend@example.com','hash');
  await runtime.audit({actorUserId:user.id,action:'backend.test',resourceType:'backend',metadata:{token:'should-not-be-returned'}});
  const rows=runtime.store.listAuditLogs({limit:5});
  assert.equal(rows[0].action,'backend.test');
  assert.doesNotMatch(JSON.stringify(rows[0]),/should-not-be-returned/);
  await runtime.close();
});

test('production readiness treats declared managed backends as required even without the global scaleout flag',async()=>{
  const {readiness}=await import('../src/ops/readiness.js?backend-readiness');
  const previous={...process.env};
  try{
    process.env.NODE_ENV='production';
    process.env.CODINGVIBES_SESSION_SECRET='x'.repeat(64);
    process.env.CODINGVIBES_ENFORCE_QUOTAS='true';
    process.env.CODINGVIBES_PUBLIC_URL='https://example.com';
    process.env.CODINGVIBES_ENABLE_BROWSER='true';
    process.env.CODINGVIBES_RUNTIME='container';
    process.env.CODINGVIBES_CONTAINER_IMAGE='node:22-bookworm-slim';
    process.env.CODINGVIBES_PROJECT_ROOT='/tmp/bv-projects';
    process.env.CODINGVIBES_WORK_ROOT='/tmp/bv-work';
    process.env.CODINGVIBES_CHECKPOINT_ROOT='/tmp/bv-checkpoints';
    process.env.CODINGVIBES_DB_BACKEND='postgres';
    process.env.CODINGVIBES_OBJECT_BACKEND='s3';
    process.env.CODINGVIBES_QUEUE_BACKEND='redis';
    delete process.env.DATABASE_URL;
    delete process.env.CODINGVIBES_OBJECT_BUCKET;
    delete process.env.CODINGVIBES_REDIS_URL;
    const result=readiness({router:{getStatus:()=>({configured:true,provider:'openai'})}});
    assert.ok(result.blockers.includes('backend_postgres_database_not_configured'));
    assert.ok(result.blockers.includes('backend_s3_object_storage_not_configured'));
    assert.ok(result.blockers.includes('backend_redis_queue_not_configured'));
  } finally {
    for(const key of Object.keys(process.env))if(!(key in previous))delete process.env[key];
    for(const [key,value] of Object.entries(previous))process.env[key]=value;
  }
});
