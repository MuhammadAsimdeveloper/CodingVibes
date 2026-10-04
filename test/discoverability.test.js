import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {auditDiscoverability,aeoSummary} from '../src/verification/discoverability.js';

test('discoverability audit checks SEO and AEO contract',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cv-aeo-'));
 fs.writeFileSync(path.join(dir,'index.html'),'<!doctype html><html><head><title>Demo</title><meta name="description" content="A sufficiently descriptive page for discoverability."><link rel="canonical" href="https://example.com/"><meta property="og:title" content="Demo"><meta name="twitter:card" content="summary_large_image"><script type="application/ld+json">{}</script></head><body><h1>Demo</h1></body></html>');
 for(const f of ['robots.txt','sitemap.xml','llms.txt'])fs.writeFileSync(path.join(dir,f),f==='llms.txt'?'# Demo\n\n- https://example.com/':'ok');
 const audit=auditDiscoverability(dir,{baseUrl:'https://example.com'});
 assert.equal(audit.ok,true);assert.equal(audit.score,100);assert.equal(aeoSummary(audit).answerEngineReady,true);
 fs.rmSync(dir,{recursive:true,force:true});
});