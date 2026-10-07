import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {auditProductExperience} from '../src/agent/product-quality.js';
import {buildBlueprint} from '../src/platform/blueprint.js';

test('product quality audit measures launch-critical UX without external services',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'bv-quality-'));fs.mkdirSync(path.join(root,'public'));
 fs.writeFileSync(path.join(root,'public','index.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width"><meta name="description" content="test"></head><body><nav>Nav</nav><main><button>Buy</button></main></body></html>');
 fs.writeFileSync(path.join(root,'public','styles.css'),'@media(max-width:700px){body{font-size:16px}} @media(prefers-reduced-motion:reduce){*{animation:none}} button:hover{transform:scale(1.01)}');
 const report=auditProductExperience(root,{behavior:{payments:true}});
 assert.equal(report.providerIndependent,true);assert.ok(report.score>=60);assert.ok(report.missing.includes('launch surfaces'));
});

test('blueprint explicitly promises automatic completion and provider-independent core',()=>{
 const b=buildBlueprint('Build a premium booking SaaS with customer accounts, payments, calendar and mobile app');
 assert.equal(b.completion.autoFillMissing,true);assert.equal(b.completion.providerIndependentCore,true);assert.ok(b.completion.defaults.includes('responsive'));assert.ok(b.targets.length>=1);
});
