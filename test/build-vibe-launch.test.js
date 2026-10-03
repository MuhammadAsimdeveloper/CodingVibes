import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeRequirements } from '../src/agent/requirements.js';
import { generateProject } from '../src/agent/project-generator.js';
import { getTarget } from '../src/targets/registry.js';
import { generateTargetFallback } from '../src/targets/generator.js';
import { PLANS } from '../src/billing/plans.js';

const read = path => fs.readFileSync(path, 'utf8');

test('public product branding is Build Vibe while compatibility identifiers remain internal', () => {
  for (const path of [
    'public/landing.html',
    'public/index.html',
    'public/ops.html',
    'public/app.js',
    'src/agent/project-generator.js'
  ]) {
    const source = read(path);
    assert.match(source, /Build Vibe/, path);
    for (const legacy of [
      'Coding Vibes',
      'codingVibes app',
      'Generated codingVibes app',
      'generated-codingvibes-app',
      'codingvibes-preview'
    ]) {
      assert.equal(source.includes(legacy), false, path + ': ' + legacy);
    }
  }
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.name, 'build-vibe');
  assert.match(pkg.description, /Build Vibe/);
});

test('landing page remains CSP-safe without inline executable code or style mutations', () => {
  const source = read('public/landing.js');
  assert.equal(source.includes('.style'), false);
  assert.equal(source.includes('<style'), false);
  const html = read('public/landing.html');
  assert.doesNotMatch(html, /<script(?![^>]*src=)(?![^>]*type=[\"']application\\/ld\\+json[\"'])[^>]*>/i);
  assert.doesNotMatch(html, /\sstyle\s*=/i);
});

test('browser verification initializes visual comparison state', () => {
  const source = read('src/verification/playwright.js');
  assert.ok(source.includes('domSnapshot=null,visual=null'));
  assert.ok(source.includes('visual=await comparePng'));
});

test('generated site authentication marks session cookies Secure in production', () => {
  const source = read('src/templates/runtime/site-auth.js');
  assert.match(source, /process\.env\.NODE_ENV==='production'/);
  assert.ok(source.includes('; Secure'));
  assert.ok(source.includes('cookieHeader'));
});

test('pricing stays below current monthly competitor reference prices', () => {
  assert.equal(PLANS.pro.priceUsd, 7);
  assert.equal(PLANS.team.priceUsd, 15);
  assert.ok(PLANS.pro.priceUsd < 9);
  assert.ok(PLANS.pro.priceUsd < 25);
  assert.ok(PLANS.team.priceUsd < 18);
  assert.ok(PLANS.team.priceUsd < 25);
  const landing = read('public/landing.html');
  assert.match(landing, /\$7<span>\/month<\/span>/);
  assert.match(landing, /\$15<span>\/month<\/span>/);
});

test('complete website generation includes pages, backend, data, admin and acceptance test', () => {
  const spec = analyzeRequirements(
    'Build a complete responsive ecommerce website with products, checkout, customer records, search, owner admin, authentication and SEO',
    { targetId: 'web-node' }
  );
  const plan = generateProject(spec);
  const paths = new Set(plan.files.map(file => file.path));
  for (const required of [
    'package.json',
    'codingvibes.app.json',
    'app/server.js',
    'app/auth.js',
    'public/admin.html',
    'public/index.html',
    'public/content/site.json',
    'test/acceptance.test.js',
    'src/generated/routes.js',
    'src/generated/model.js'
  ]) assert.ok(paths.has(required), required);
  assert.ok(spec.pages.length >= 3);
  assert.ok(spec.apis.length >= 2);
  assert.ok(spec.dataModel.length >= 2);
  assert.ok(paths.has('public/shop.html'));
});

test('app generation covers a mobile target contract without pretending binary verification', () => {
  const spec = analyzeRequirements('Build a polished Android and iOS mobile app for appointment booking with authentication, profiles and notifications', { targetId: 'mobile-expo' });
  const target = getTarget('mobile-expo');
  const plan = generateTargetFallback(spec, target);
  assert.equal(spec.target.id, 'mobile-expo');
  assert.ok(plan);
  const paths = new Set(plan.files.map(file => file.path));
  for (const required of target.requiredFiles) assert.ok(paths.has(required), required);
});

test('landing SEO metadata has unique identity and crawl directives', () => {
  const html = read('public/landing.html');
  assert.match(html, /<title>Build Vibe — AI Product Builder<\/title>/);
  assert.match(html, /name="description"/);
  assert.match(html, /name="robots" content="index,follow"/);
  assert.match(html, /rel="canonical"/);
  assert.match(html, /property="og:title"/);
  assert.match(html, /property="og:description"/);
  assert.match(html, /name="twitter:card"/);
});

test('generated sites emit indexability essentials', () => {
  const source = read('src/agent/project-generator.js');
  for (const required of ['meta name="description"', 'meta name="robots"', 'rel="canonical"', 'manifest.webmanifest', "robots.txt", "sitemap.xml"]) {
    assert.ok(source.includes(required), required);
  }
  assert.ok(source.includes("Disallow: /admin"));
});

test('CI runs launch readiness after starting the app', () => {
  const source = read('.github/workflows/ci.yml');
  assert.match(source, /name: Build Vibe CI/);
  assert.match(source, /launch readiness/i);
  assert.match(source, /npm run launch:check/);
});
