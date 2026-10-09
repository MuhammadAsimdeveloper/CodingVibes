import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {auditGeneratedProject} from '../src/agent/tool-fabric.js';

function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'build-vibe-tool-audit-'));
  for (const [relative, content] of Object.entries(files)) {
    const full = path.join(root, relative);
    fs.mkdirSync(path.dirname(full), {recursive:true});
    fs.writeFileSync(full, content);
  }
  return root;
}

test('generated-project Tool Fabric audit records local SEO and accessibility evidence for public HTML', async t => {
  const root = fixture({
    'public/index.html': '<!doctype html><html lang="en"><head><title>Build Vibe homepage</title><meta name="description" content="A useful homepage description for users and search engines."><link rel="canonical" href="https://example.com/"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><h1>Welcome</h1><img src="/hero.png" alt="Abstract hero"></body></html>',
    'public/about.html': '<!doctype html><html><head><title>About</title></head><body><h1>About our product</h1><button></button><img src="/team.png"></body></html>',
    'public/assets/not-a-page.json': '{"ignored":true}'
  });
  t.after(() => fs.rmSync(root, {recursive:true, force:true}));

  const result = await auditGeneratedProject(root);

  assert.equal(result.status, 'COMPLETED');
  assert.equal(result.networkUsed, false);
  assert.equal(result.pagesScanned, 2);
  assert.equal(result.truncated, false);
  assert.ok(result.pages.some(page => page.path === 'index.html'));
  const about = result.pages.find(page => page.path === 'about.html');
  assert.ok(about.seo.findings.some(finding => finding.code === 'description_missing'));
  assert.ok(about.accessibility.findings.some(finding => finding.code === 'document_lang_missing'));
  assert.ok(about.accessibility.findings.some(finding => finding.code === 'button_name_missing'));
  assert.ok(result.summary.seoFindings > 0);
  assert.ok(result.summary.accessibilityFindings > 0);
});

test('generated-project audit handles a missing public directory explicitly', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'build-vibe-no-public-'));
  try {
    const result = await auditGeneratedProject(root);
    assert.equal(result.status, 'SKIPPED');
    assert.equal(result.reason, 'public_directory_missing');
    assert.equal(result.pagesScanned, 0);
  } finally {
    fs.rmSync(root, {recursive:true,force:true});
  }
});

test('generated-project audit caps pages and skips oversized HTML without reading it into the model evidence', async t => {
  const root = fixture({
    'public/a.html': '<html lang="en"><head><title>Page A title</title><meta name="description" content="A valid, useful description for the first page here."></head><body><h1>Page A</h1></body></html>',
    'public/b.html': '<html lang="en"><head><title>Page B title</title><meta name="description" content="A valid, useful description for the second page here."></head><body><h1>Page B</h1></body></html>',
    'public/large.html': 'x'.repeat(1_000_100)
  });
  t.after(() => fs.rmSync(root, {recursive:true,force:true}));

  const result = await auditGeneratedProject(root, {maxPages: 1, maxBytesPerFile: 1000});

  assert.equal(result.pagesScanned, 1);
  assert.equal(result.truncated, true);
  assert.equal(result.oversizedFiles, 1);
  assert.ok(result.pages.some(page => page.status === 'INPUT_TOO_LARGE'));
});
