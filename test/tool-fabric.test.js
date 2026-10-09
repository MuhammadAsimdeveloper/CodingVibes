import test from 'node:test';
import assert from 'node:assert/strict';
import {getToolContract, listToolContracts, runTool} from '../src/tool-fabric/index.js';

test('canonical Tool Fabric publishes 18 unique contracts with auditable safety metadata', () => {
  const contracts = listToolContracts();
  assert.equal(contracts.length, 18);
  assert.equal(new Set(contracts.map(contract => contract.id)).size, contracts.length);
  for (const contract of contracts) {
    assert.equal(contract.owner, 'build-vibe');
    assert.ok(contract.inputSchema && contract.outputSchema);
    assert.ok(['low','medium','high'].includes(contract.riskClass));
    assert.ok(['local','browser','adapter'].includes(contract.executionMode));
    assert.equal(typeof contract.networkRequired, 'boolean');
    assert.equal(typeof contract.confirmationRequired, 'boolean');
    assert.ok(contract.timeoutMs > 0);
    assert.ok(contract.maxRetries >= 0);
    assert.ok(contract.auditEvent);
    assert.ok(contract.fallback);
  }
  assert.equal(getToolContract('seo-meta-generator').id, 'seo.meta.generate');
});

test('SEO meta and Open Graph generators escape untrusted text', async () => {
  const meta = await runTool('seo.meta.generate', {
    title: '<script>alert(1)</script>', description: 'A useful website description', url: 'https://example.com/'
  });
  assert.equal(meta.status, 'COMPLETED');
  assert.doesNotMatch(meta.output.html, /<script>alert/);
  assert.match(meta.output.html, /&lt;script&gt;/);
  const og = await runTool('seo.og.generate', {
    title: 'A product', description: 'A safe summary of this product page', url: 'https://example.com/product'
  });
  assert.equal(og.status, 'COMPLETED');
  assert.match(og.output.html, /og:title/);
  assert.match(og.output.html, /twitter:card/);
  assert.match(og.output.html, /<meta name=\"twitter:card\"/);
});

test('sitemap generator deduplicates valid HTTP URLs and rejects script schemes', async () => {
  const valid = await runTool('seo.sitemap.generate', {
    urls: ['https://example.com/', 'https://example.com/', 'https://example.com/about']
  });
  assert.equal(valid.status, 'COMPLETED');
  assert.equal((valid.output.xml.match(/<url>/g) || []).length, 2);
  const invalid = await runTool('seo.sitemap.generate', {urls: ['javascript:alert(1)']});
  assert.equal(invalid.status, 'INVALID_INPUT');
});

test('robots and favicon generators return safe local artifacts', async () => {
  const robots = await runTool('seo.robots.generate', {
    disallow: ['/admin', '/api/'], sitemap: 'https://example.com/sitemap.xml'
  });
  assert.equal(robots.status, 'COMPLETED');
  assert.match(robots.output.text, /Disallow: \/admin/);
  assert.match(robots.output.text, /Sitemap: https:\/\/example.com\/sitemap.xml/);
  const favicon = await runTool('design.favicon.generate', {text: '<x>', background: '#123abc'});
  assert.equal(favicon.status, 'COMPLETED');
  assert.match(favicon.output.svg, /&lt;x&gt;/);
  assert.doesNotMatch(favicon.output.svg, /<script/i);
});

test('JSON formatter and JSON-to-TypeScript produce deterministic local output', async () => {
  const formatted = await runTool('json.format', {text: '{"a":1,"nested":{"ok":true}}'});
  assert.equal(formatted.status, 'COMPLETED');
  assert.equal(formatted.output.formatted, JSON.stringify({a:1,nested:{ok:true}}, null, 2));
  const invalid = await runTool('json.format', {text: '{'});
  assert.equal(invalid.status, 'INVALID_INPUT');
  const types = await runTool('json.typescript', {json: '{"id":1,"name":"Asim","active":true}'});
  assert.equal(types.status, 'COMPLETED');
  assert.match(types.output.typescript, /interface Root/);
  assert.match(types.output.typescript, /id: number/);
  assert.match(types.output.typescript, /name: string/);
});

test('static SEO and accessibility audits report evidence from supplied HTML only', async () => {
  const html = '<html><head><title>Short</title></head><body><img src="hero.png"><h1>One</h1><h1>Two</h1><button></button></body></html>';
  const seo = await runTool('seo.audit', {html});
  assert.equal(seo.status, 'COMPLETED');
  assert.ok(seo.output.findings.some(item => item.code === 'description_missing'));
  assert.ok(seo.output.findings.some(item => item.code === 'image_alt_missing'));
  const a11y = await runTool('web.accessibility.audit', {html});
  assert.equal(a11y.status, 'COMPLETED');
  assert.ok(a11y.output.findings.some(item => item.code === 'document_lang_missing'));
  assert.ok(a11y.output.findings.some(item => item.code === 'button_name_missing'));
});

test('performance audits require real metrics instead of fabricating browser measurements', async () => {
  const empty = await runTool('web.performance.audit', {});
  assert.equal(empty.status, 'NEEDS_BROWSER_METRICS');
  const audited = await runTool('web.performance.audit', {
    metrics: {lcpMs: 4500, cls: 0.3, inpMs: 400, ttfbMs: 1200, totalBytes: 4_000_000, jsBytes: 1_500_000, imageBytes: 1_000_000}
  });
  assert.equal(audited.status, 'COMPLETED');
  assert.ok(audited.output.score < 100);
  assert.ok(audited.output.findings.length > 0);
});

test('API tester blocks private destinations and never performs an unconfigured request', async () => {
  const blocked = await runTool('api.test', {url: 'http://127.0.0.1:8080/admin', method: 'GET'});
  assert.equal(blocked.status, 'BLOCKED');
  const publicPlan = await runTool('api.test', {
    url: 'https://example.com/api', method: 'GET',
    headers: {Authorization: 'Bearer top-secret', Accept: 'application/json'}
  });
  assert.equal(publicPlan.status, 'NOT_CONFIGURED');
  assert.equal(publicPlan.output.request.url, 'https://example.com/api');
  assert.ok(publicPlan.output.request.headerNames.includes('Authorization'));
  assert.doesNotMatch(JSON.stringify(publicPlan), /top-secret/);
});

test('regex tester returns bounded matches and rejects common catastrophic patterns', async () => {
  const result = await runTool('regex.test', {pattern: '\\w+', input: 'build vibe 13'});
  assert.equal(result.status, 'COMPLETED');
  assert.ok(result.output.matches.length >= 2);
  const unsafePattern = String.fromCharCode(40, 97, 43, 41, 43, 36);
  const unsafe = await runTool('regex.test', {pattern: unsafePattern, input: 'aaaaaaaaaaaaaaaa!'});
  assert.equal(unsafe.status, 'BLOCKED');
});

test('JWT inspector explicitly reports decoded-only, unverified claims', async () => {
  const header = Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
  const payload = Buffer.from(JSON.stringify({sub:'user-1',admin:false})).toString('base64url');
  const result = await runTool('jwt.inspect', {token: header + '.' + payload + '.signature'});
  assert.equal(result.status, 'COMPLETED');
  assert.equal(result.output.signatureVerified, false);
  assert.equal(result.output.payload.sub, 'user-1');
  assert.ok(result.warnings.some(warning => /not verified/i.test(warning)));
});

test('Base64 and binary conversions round-trip locally', async () => {
  const encoded = await runTool('encoding.base64-binary', {operation: 'base64-encode', value: 'Hello'});
  assert.equal(encoded.output.value, 'SGVsbG8=');
  const decoded = await runTool('encoding.base64-binary', {operation: 'base64-decode', value: 'SGVsbG8='});
  assert.equal(decoded.output.value, 'Hello');
  const binary = await runTool('encoding.base64-binary', {operation: 'binary-encode', value: 'A'});
  assert.equal(binary.output.value, '01000001');
  const binaryDecoded = await runTool('encoding.base64-binary', {operation: 'binary-decode', value: '01000001'});
  assert.equal(binaryDecoded.output.value, 'A');
});

test('color palette and gradient tools validate before generating CSS', async () => {
  const palette = await runTool('design.color.palette', {color: '#336699'});
  assert.equal(palette.status, 'COMPLETED');
  assert.equal(palette.output.colors.length, 7);
  assert.ok(palette.output.colors.every(color => /^#[0-9a-f]{6}$/i.test(color.hex)));
  const gradient = await runTool('design.css.gradient', {colors: ['#ff0000', '#0000ff'], angle: 135});
  assert.equal(gradient.status, 'COMPLETED');
  assert.equal(gradient.output.css, 'linear-gradient(135deg, #ff0000 0%, #0000ff 100%)');
  const unsafe = await runTool('design.css.gradient', {colors: ['red;}</style><script>', '#000000']});
  assert.equal(unsafe.status, 'INVALID_INPUT');
});

test('QR tool emits a local SVG QR artifact and rejects payloads beyond supported capacity', async () => {
  const qr = await runTool('qr.generate', {text: 'https://example.com'});
  assert.equal(qr.status, 'COMPLETED');
  assert.match(qr.output.svg, /<svg/);
  assert.match(qr.output.svg, /shape-rendering="crispEdges"/);
  assert.match(qr.output.svg, /<path/);
  const large = await runTool('qr.generate', {text: 'x'.repeat(100)});
  assert.equal(large.status, 'INVALID_INPUT');
});

test('image optimizer advertises its actual browser-only boundary', async () => {
  const image = await runTool('image.optimize', {});
  assert.equal(image.status, 'BROWSER_REQUIRED');
  assert.equal(getToolContract('image.optimize').executionMode, 'browser');
});

 
test('QR generation rejects non-ASCII until explicit UTF-8 ECI support is present', async () => {
  const result = await runTool('qr.generate', {text: '你好'});
  assert.equal(result.status, 'INVALID_INPUT');
});


import * as toolFabric from '../src/tool-fabric/index.js';

test('Tool Fabric pipelines compose local tools through explicit prior-output references', async () => {
  assert.equal(typeof toolFabric.runToolPipeline, 'function');
  const result = await toolFabric.runToolPipeline({
    steps: [
      {id: 'format', tool: 'json.format', input: {text: '{"name":"Build Vibe","enabled":true}'}},
      {id: 'types', tool: 'json.typescript', input: {json: {$ref: 'format.output.formatted'}, rootName: 'Product'}}
    ]
  });

  assert.equal(result.ok, true);
  assert.equal(result.status, 'COMPLETED');
  assert.equal(result.networkUsed, false);
  assert.equal(result.stepCount, 2);
  assert.equal(result.results[0].id, 'format');
  assert.equal(result.results[0].status, 'COMPLETED');
  assert.match(result.results[1].output.typescript, /interface Product/);
  assert.match(result.results[1].output.typescript, /name: string/);
  assert.match(result.results[1].output.typescript, /enabled: boolean/);
});

test('Tool Fabric pipelines reject forward, missing and prototype-property references before execution', async () => {
  const forward = await toolFabric.runToolPipeline({
    steps: [
      {id: 'types', tool: 'json.typescript', input: {json: {$ref: 'later.output.formatted'}}},
      {id: 'later', tool: 'json.format', input: {text: '{"ok":true}'}}
    ]
  });
  assert.equal(forward.status, 'INVALID_REFERENCE');
  assert.equal(forward.results.length, 0);

  const prototype = await toolFabric.runToolPipeline({
    steps: [
      {id: 'format', tool: 'json.format', input: {text: '{"ok":true}'}},
      {id: 'types', tool: 'json.typescript', input: {json: {$ref: 'format.output.__proto__'}}}
    ]
  });
  assert.equal(prototype.status, 'INVALID_REFERENCE');
  assert.equal(prototype.results.length, 0);
});

test('Tool Fabric pipelines preflight every tool and reject browser or network adapters', async () => {
  const result = await toolFabric.runToolPipeline({
    steps: [
      {id: 'format', tool: 'json.format', input: {text: '{"safe":true}'}},
      {id: 'request', tool: 'api.test', input: {url: 'https://example.com'}}
    ]
  });
  assert.equal(result.ok, false);
  assert.equal(result.status, 'PIPELINE_BLOCKED');
  assert.equal(result.results.length, 0);
  assert.equal(result.networkUsed, false);
});

test('Tool Fabric pipelines stop on the first failed step and enforce bounded unique step IDs', async () => {
  const failed = await toolFabric.runToolPipeline({
    steps: [
      {id: 'bad-json', tool: 'json.format', input: {text: '{'}},
      {id: 'must-not-run', tool: 'json.format', input: {text: '{"ok":true}'}}
    ]
  });
  assert.equal(failed.status, 'STEP_FAILED');
  assert.equal(failed.failedStepId, 'bad-json');
  assert.equal(failed.failedStatus, 'INVALID_INPUT');
  assert.equal(failed.results.length, 1);

  const duplicate = await toolFabric.runToolPipeline({
    steps: [
      {id: 'same', tool: 'json.format', input: {text: '{"ok":true}'}},
      {id: 'same', tool: 'json.format', input: {text: '{"next":true}'}}
    ]
  });
  assert.equal(duplicate.status, 'INVALID_PIPELINE');
  assert.equal(duplicate.results.length, 0);

  const tooMany = await toolFabric.runToolPipeline({
    steps: Array.from({length: 11}, (_, index) => ({
      id: 'step-' + index, tool: 'json.format', input: {text: '{"step":' + index + '}'}
    }))
  });
  assert.equal(tooMany.status, 'INVALID_PIPELINE');
  assert.equal(tooMany.results.length, 0);
});


test('accessibility audit does not treat script-only button content as an accessible name', async () => {
  const html = '<html lang="en"><body><button><script>alert(1)</script></button><button>Submit</button></body></html>';
  const result = await runTool('web.accessibility.audit', {html});
  assert.equal(result.status, 'COMPLETED');
  assert.ok(result.output.findings.some(item => item.code === 'button_name_missing'),
    'script-only content must not count as visible button text');
});
