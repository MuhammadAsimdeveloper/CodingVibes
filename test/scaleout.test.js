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