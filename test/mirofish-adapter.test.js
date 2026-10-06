import test from 'node:test';
import assert from 'node:assert/strict';
import {getMiroFishStatus,runMiroFishScenario} from '../src/integrations/mirofish.js';

test('MiroFish adapter is non-blocking and explicit when unconfigured',async()=>{
  assert.deepEqual(getMiroFishStatus({}),{status:'NOT_CONFIGURED',available:false,reason:'MiroFish URL and API key are not configured'});
  const result=await runMiroFishScenario({scenario:{id:'contract'},env:{}});
  assert.equal(result.status,'NOT_CONFIGURED');
  assert.equal(result.available,false);
});
