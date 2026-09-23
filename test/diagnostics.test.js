import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDiagnostics} from '../src/agent/diagnostics.js';

test('diagnostics converts verification and browser failures into actionable findings',()=>{
  const out=buildDiagnostics({
    run:{status:'failed'},
    evidence:[{type:'verification',payload:{attempt:1,failures:['GET /api/items returned 500'],browser:{available:true,debug:{consoleErrors:2,requestFailures:1,serverErrors:1}}}}]
  });
  assert.equal(out.status,'attention');
  assert.ok(out.findings.some(x=>x.title==='console-errors'));
  assert.ok(out.findings.some(x=>x.title==='server-errors'));
  assert.ok(out.findings.some(x=>x.title==='verification-failure'));
});

test('diagnostics reports missing pricing as advisory',()=>{
  const out=buildDiagnostics({run:{status:'verified'},usage:{calls:2,estimated_cost_usd:null}});
  assert.equal(out.status,'advisory');
  assert.ok(out.findings.some(x=>x.title==='pricing-unavailable'));
});
