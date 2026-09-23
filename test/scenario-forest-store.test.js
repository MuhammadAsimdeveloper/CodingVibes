import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {analyzeRequirements} from '../src/agent/requirements.js';
import {generateProject} from '../src/agent/project-generator.js';
import {verifyContract} from '../src/verification/contract.js';

test('forest commerce prompt becomes a 3D storefront contract and runnable acceptance build',async()=>{
  const prompt='Create a 3D style forest that contains my online store items hanging on trees with product details and a purchase option, with a complete Stripe payment method added. Make it immersive, animated, responsive, accessible, and production-ready.';
  const spec=analyzeRequirements(prompt);
  assert.equal(spec.target.id,'web-node');
  assert.equal(spec.styling.visual.threeD,true);
  assert.equal(spec.behavior.payments,true);
  assert.equal(spec.behavior.paymentProvider,'stripe');
  assert.ok(spec.pages.includes('/shop'));
  assert.ok(spec.pages.includes('/checkout'));
  assert.ok(spec.apis.some(x=>x.path==='/api/checkout/session'));
  assert.ok(spec.apis.some(x=>x.path==='/api/webhooks/stripe'));
  assert.ok(spec.acceptance.some(x=>x.includes('raw card')));

  const plan=generateProject(spec);
  const source=plan.files.filter(x=>/\.(js|html|css|json)$/.test(x.path)).map(x=>x.content).join('\n');
  assert.match(source,/forest-scene/);
  assert.match(source,/data-checkout/);
  assert.match(source,/checkout\/session/);

  const root=fs.mkdtempSync(path.join(os.tmpdir(),'codingvibes-forest-'));
  for(const f of plan.files){const out=path.join(root,f.path);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,f.content)}
  const result=await import('node:child_process').then(({execFileSync})=>{execFileSync('npm',['test'],{cwd:root,stdio:'pipe'});return true});
  assert.equal(result,true);
  const contract=verifyContract(spec,{commands:[{code:0,command:'npm test'}],http:{passed:true},browser:{enabled:false,available:false,passed:true},sourceText:source});
  assert.equal(contract.passed,true);
  fs.rmSync(root,{recursive:true,force:true});
});
