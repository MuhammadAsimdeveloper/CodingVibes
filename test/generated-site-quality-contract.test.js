import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyContract } from '../src/verification/contract.js';

const spec={pages:['/'],acceptance:['public page returns successfully']};

test('production verification blocks critical generated-site quality gaps',()=>{
  const generatedSiteQuality={publishable:false,requirements:[
    {id:'custom-404',severity:'critical',status:'NEEDS_INPUT'},
    {id:'privacy-policy',severity:'critical',status:'PASS'}
  ]};
  const result=verifyContract(spec,{productQuality:{generatedSiteQuality},enforceGeneratedSiteQuality:true});
  assert.equal(result.passed,false);
  assert.match(result.failures.join(' '),/Generated-site quality gate blocked: custom-404=NEEDS_INPUT/);
  assert.equal(result.generatedSiteQualityGate.status,'BLOCKED');
  assert.deepEqual(result.generatedSiteQualityGate.blockers,[{id:'custom-404',status:'NEEDS_INPUT',severity:'critical'}]);
});

test('non-production verification keeps an incomplete site report informational',()=>{
  const generatedSiteQuality={publishable:false,requirements:[{id:'cookie-consent',severity:'critical',status:'NEEDS_INPUT'}]};
  const result=verifyContract(spec,{productQuality:{generatedSiteQuality},enforceGeneratedSiteQuality:false});
  assert.equal(result.passed,true);
  assert.equal(result.generatedSiteQualityGate.status,'INFORMATIONAL');
});

test('enforced quality gate passes when all critical checks pass or are not applicable',()=>{
  const generatedSiteQuality={publishable:true,requirements:[
    {id:'custom-404',severity:'critical',status:'PASS'},
    {id:'form-error-states',severity:'critical',status:'NOT_APPLICABLE'}
  ]};
  const result=verifyContract(spec,{productQuality:{generatedSiteQuality},enforceGeneratedSiteQuality:true});
  assert.equal(result.passed,true);
  assert.equal(result.generatedSiteQualityGate.status,'PASS');
});
