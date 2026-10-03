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
    for (const legacy of ['Coding Vibes', 'codingVibes app', 'Generated codingVibes app', 'generated-codingvibes-app', 'codingvibes-preview']) assert.equal(source.includes(legacy), false, path + ': ' + legacy);
  }
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.name, 'build-vibe');
  assert.match(pkg.description, /Build Vibe/);
});

test('landing page JavaScript does not depend on CSP-blocked inline style mutations', () => {
  const source = read('public/landing.js');
  assert.doesNotMatch(source, /\.style\b/);
  assert.doesNotMatch(source, /<style/i);
  assert.doesNotMatch(read('public/landing.html'), /<script\b(?![^>]*src=)[^>]*>/i);
});

test('generated site authentication marks session cookies Secure in production', () => {
  const source = read('src/templates/runtime/site-auth.js');
  assert.match(source, /production/);
  assert.match(source, /Secure/);
  assert.match(source, /cookieHeader/);
});

test('CI runs launch readiness after starting the app', () => {
  const source = read('.github/workflows/ci.yml');
  assert.match(source, /launch readiness/i);
  assert.match(source, /npm run launch:check/);
});
