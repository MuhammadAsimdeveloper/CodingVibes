import test from 'node:test';
import assert from 'node:assert/strict';
import {BuildConcurrency} from '../src/runtime/build-concurrency.js';

test('build concurrency is bounded per user but permits separate project windows',()=>{
 const c=new BuildConcurrency(2);
 assert.ok(c.acquire('u1','p1','r1'));
 assert.ok(c.acquire('u1','p2','r2'));
 assert.equal(c.acquire('u1','p3','r3'),false);
 assert.equal(c.isBusy('u1','p1'),true);
 c.release('u1','p1');
 assert.ok(c.acquire('u1','p3','r3'));
 c.release('u1','p2');c.release('u1','p3');
 assert.equal(c.count('u1'),0);
});
