import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {auditDiscoverability,aeoSummary} from '../src/verification/discoverability.js';

test('discoverability audit checks SEO and AEO contract',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cv-aeo-'));
 fs.writeFileSync(path.join(dir,'index.html'),'<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#ffffff"><meta name="author" content="Demo Team"><link rel="manifest" href="/manifest.webmanifest"><title>Demo Website | Product</title><meta name="description" content="A sufficiently descriptive public page for discoverability and product information that helps people understand the offering."><meta name="robots" content="index,follow"><link rel="canonical" href="https://example.com/"><meta property="og:title" content="Demo Website | Product"><meta property="og:description" content="A sufficiently descriptive public page for discoverability and product information that helps people understand the offering."><meta property="og:url" content="https://example.com/"><meta property="og:image" content="https://example.com/og.svg"><meta property="og:image:alt" content="Demo Website preview"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="Demo Website | Product"><meta name="twitter:description" content="A sufficiently descriptive public page for discoverability and product information that helps people understand the offering."><meta name="twitter:image" content="https://example.com/og.svg"><meta name="twitter:image:alt" content="Demo Website preview"><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebSite","name":"Demo"},{"@type":"WebPage","name":"Demo"}]}</script></head><body><main><h1>Demo Website</h1><p>Useful product information.</p><a href="/features">Features</a><a href="/about">About</a></main></body></html>');
 for(const f of ['robots.txt','sitemap.xml','llms.txt'])fs.writeFileSync(path.join(dir,f),f==='llms.txt'?'# Demo\n\n- https://example.com/':f==='sitemap.xml'?'<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://example.com/</loc></url></urlset>':'User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://example.com/sitemap.xml');
 const audit=auditDiscoverability(dir,{baseUrl:'https://example.com'});
 assert.equal(audit.ok,true);assert.equal(audit.score,100);assert.equal(aeoSummary(audit).answerEngineReady,true);
 fs.rmSync(dir,{recursive:true,force:true});
});