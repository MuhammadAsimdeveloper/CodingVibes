import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMiroFishQAScenario,normalizeMiroFishQAResult} from '../src/verification/mirofish-qa.js';

test('MiroFish QA scenario is bounded and based on product acceptance criteria',()=>{
 const s=buildMiroFishQAScenario({request:'3D ecommerce store',pages:['/','/shop','/checkout'],acceptance:['checkout works','3D fallback works']});
 assert.equal(s.version,'mirofish-qa.v1');
 assert.equal(s.seed.type,'product-acceptance');
 assert.equal(s.questions.length,2);
 assert.ok(JSON.stringify(s).length<12000);
 assert.equal(normalizeMiroFishQAResult({status:'complete',score:91}).score,91);
});
