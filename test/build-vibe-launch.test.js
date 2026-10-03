import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

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
  assert.doesNotMatch(html, /<script(?![^>]*src=)[^>]*>/i);
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

test('pricing stays below the referenced monthly competitor plans', () => {
  const plans = (await import('../src/billing/plans.js')).PLANS;
  assert.equal(plans.pro.priceUsd, 7);
  assert.equal(plans.team.priceUsd, 15);
  assert.ok(plans.pro.priceUsd < 9);
  assert.ok(plans.pro.priceUsd < 25);
  assert.ok(plans.team.priceUsd < 18);
  assert.ok(plans.team.priceUsd < 25);
  const landing = read('public/landing.html');
  assert.match(landing, /\$7<span>\/month<\/span>/);
  assert.match(landing, /\$15<span>\/month<\/span>/);
});

test('CI runs launch readiness after starting the app', () => {
  const source = read('.github/workflows/ci.yml');
  assert.match(source, /name: Build Vibe CI/);
  assert.match(source, /launch readiness/i);
  assert.match(source, /npm run launch:check/);
});
