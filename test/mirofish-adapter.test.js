import test from 'node:test';
import assert from 'node:assert/strict';
import {getMiroFishStatus,runMiroFishScenario,ingestMiroFishResult,normalizeMiroFishScore} from '../src/integrations/mirofish.js';

test('MiroFish adapter is non-blocking and explicit when unconfigured',async()=>{
  assert.equal(getMiroFishStatus({}).status,'NOT_CONFIGURED');
  const result=await runMiroFishScenario({scenario:{id:'contract'},env:{}});
  assert.equal(result.status,'NOT_CONFIGURED');
  assert.equal(result.available,false);
});

test('MiroFish score normalization and ingestion are bounded',()=>{
  assert.equal(normalizeMiroFishScore(120),100);
  assert.equal(normalizeMiroFishScore(-5),0);
  assert.equal(normalizeMiroFishScore('bad'),null);
  assert.deepEqual(ingestMiroFishResult({id:'r1',status:'complete',score:87.345}),{status:'INGESTED',score:87.35,rawStatus:'complete',providerId:'r1'});
});
