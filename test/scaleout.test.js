import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createLocalObjectStore} from '../src/storage/object-store.js';
import {InMemoryJobQueue} from '../src/jobs/queue.js';
import {postgresConfigStatus} from '../src/db/postgres.js';
import {scaleOutConfig} from '../src/platform/scaleout.js';

test('local object store writes, hashes, reads and deletes safely',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'build-vibe-object-'));
 const store=createLocalObjectStore(root);
 const written=await store.put({key:'runs/test/output.txt',body:'hello world',contentType:'text/plain'});
 assert.equal(written.size,11);
 assert.equal(written.sha256.length,64);
 const read=await store.get({key:'runs/test/output.txt'});
 assert.equal(read.body.toString(),'hello world');
 assert.equal((await store.head({key:'runs/test/output.txt'})).size,11);
 assert.equal((await store.delete({key:'runs/test/output.txt'})).deleted,true);
 assert.equal(await store.get({key:'runs/test/output.txt'}),null);
 assert.equal(await store.healthcheck(),true);
 assert.throws(()=>store.get({key:'../secret'}));
});

test('in-memory queue preserves jobs and supports bounded retry',async()=>{
 const queue=new InMemoryJobQueue();
 const created=await queue.enqueue({type:'build.verify',payload:{projectId:'p1'}});
 const batch=await queue.reserve({blockMs:0});
 assert.equal(batch.length,1);assert.equal(batch[0].id,created.id);
 const retry=await queue.fail(batch[0],{error:'temporary',maxAttempts:3});
 assert.equal(retry.requeued,true);assert.equal(retry.job.attempt,1);
 const next=await queue.reserve({blockMs:0});assert.equal(next[0].id,created.id);
 await queue.close();assert.equal(await queue.healthcheck(),false);
});

test('scaleout configuration fails closed for incomplete managed backends',()=>{
 const config=scaleOutConfig({CODINGVIBES_DB_BACKEND:'postgres',CODINGVIBES_OBJECT_BACKEND:'s3',CODINGVIBES_QUEUE_BACKEND:'redis'});
 assert.equal(config.ready,false);
 assert.deepEqual(config.database.missing,['DATABASE_URL']);
 assert.ok(config.blockers.includes('s3_object_bucket_missing'));
 assert.ok(config.blockers.includes('redis_queue_url_missing'));
 const pg=postgresConfigStatus({CODINGVIBES_DB_BACKEND:'postgres'});assert.equal(pg.configured,false);
});
import {readiness} from '../src/ops/readiness.js';

test('production readiness gates scaleout only when explicitly required',()=>{
 const previous={...process.env};
 try{
  process.env.NODE_ENV='production';
  process.env.CODINGVIBES_SCALEOUT_REQUIRED='true';
  process.env.CODINGVIBES_DB_BACKEND='postgres';
  delete process.env.DATABASE_URL;
  const result=readiness({router:{getStatus:()=>({configured:false,provider:null})}});
  assert.equal(result.ready,false);
  assert.ok(result.blockers.includes('scaleout_postgres_database_not_configured'));
 }finally{
  for(const key of Object.keys(process.env))if(!(key in previous))delete process.env[key];
  for(const [key,value] of Object.entries(previous))process.env[key]=value;
 }
});

import {JobWorker} from '../src/jobs/worker.js';
import {OutboxRelay} from '../src/jobs/outbox-relay.js';

test('job worker dispatches a registered handler and acknowledges the job',async()=>{
 const calls=[];let served=false;
 const queue={
  async reserve(){if(served)return [];served=true;return [{id:'job-1',type:'demo',payload:{value:7},streamId:'1-0'}];},
  async ack(id){calls.push(['ack',id]);return true;},
  async fail(job){calls.push(['fail',job.type]);return {requeued:false,job};},
  async reclaim(){return [];}
 };
 const worker=new JobWorker({queue,handlers:{demo:async payload=>calls.push(['handle',payload.value])},idleDelayMs:1,reclaimEveryMs:5000});
 const controller=new AbortController();
 const run=worker.start();
 await new Promise(r=>setTimeout(r,20));
 controller.abort();worker.stop();await run;
 assert.deepEqual(calls,[['handle',7],['ack','1-0']]);
});

test('outbox relay publishes and completes claimed work',async()=>{
 const calls=[];
 const repository={
  async claimOutbox(){return [{id:'o1',topic:'build.verify',payload:{projectId:'p1'},attempts:1}]},
  async completeOutbox(id){calls.push(['complete',id]);return {id,status:'complete'};},
  async failOutbox(){calls.push(['fail']);}
 };
 const queue={async enqueue(job){calls.push(['enqueue',job.id,job.type]);return job;}};
 const relay=new OutboxRelay({repository,queue});
 assert.equal(await relay.once(),1);
 assert.deepEqual(calls,[['enqueue','o1','build.verify'],['complete','o1']]);
});
