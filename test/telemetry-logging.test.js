import test from 'node:test';
import assert from 'node:assert/strict';
import {RequestTelemetry,requestLogEvent} from '../src/ops/telemetry.js';

test('structured request log events strip query secrets and contain only bounded safe fields',()=>{
  const event=requestLogEvent({
    requestId:'request-123\nInjected-Header: value',
    method:'get',
    path:'/api/auth/google/callback?code=very-secret&state=also-secret',
    status:500,
    durationMs:12.345,
    at:'2026-10-11T00:00:00.000Z'
  });
  assert.deepEqual(event,{
    timestamp:'2026-10-11T00:00:00.000Z',
    level:'error',
    event:'http.request',
    requestId:'request-123Injected-Headervalue',
    method:'GET',
    path:'/api/auth/google/callback',
    status:500,
    durationMs:12.35
  });
  assert.doesNotMatch(JSON.stringify(event),/very-secret|also-secret|Injected-Header:/);
});

test('structured request logging bounds path and request-id fields and derives severity from status',()=>{
  const event=requestLogEvent({requestId:'x'.repeat(150),method:'GE T/DELETE',path:'/'+Array.from({length:100},()=> 'p').join('/')+'?token=secret',status:429,durationMs:-10});
  assert.equal(event.level,'warn');
  assert.equal(event.method,'GETDELETE');
  assert.equal(event.requestId.length,100);
  assert.equal(event.path.length,160);
  assert.equal(event.durationMs,0);
  assert.doesNotMatch(JSON.stringify(event),/secret/);
});

test('telemetry redacts long identifier-like path segments',()=>{
  const event=requestLogEvent({requestId:'req-1',method:'GET',path:'/api/projects/72fa0ae7-30cb-4fd5-99e1-a4ff274f2c4c/builds?private=1',status:200,durationMs:2});
  assert.equal(event.path,'/api/projects/:id/builds');
  assert.doesNotMatch(JSON.stringify(event),/72fa0ae7|private=1/);
});

test('process telemetry tracks bounded status families, errors and latency percentiles',()=>{
  const telemetry=new RequestTelemetry({maxRoutes:2});
  telemetry.record({method:'GET',path:'/health?token=ignored',status:200,durationMs:20});
  telemetry.record({method:'GET',path:'/health',status:503,durationMs:90});
  telemetry.record({method:'POST',path:'/api/build',status:500,durationMs:150});
  const snapshot=telemetry.snapshot();
  assert.equal(snapshot.requests.total,3);
  assert.equal(snapshot.requests.errors,2);
  assert.equal(snapshot.statusFamilies['2'],1);
  assert.equal(snapshot.statusFamilies['5'],2);
  assert.equal(snapshot.latency.p95Ms,150);
  assert.ok(snapshot.routes.length<=2);
  assert.ok(snapshot.routes.every(route=>!route.path.includes('?')));
});
