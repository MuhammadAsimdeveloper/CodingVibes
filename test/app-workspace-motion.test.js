import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('builder workspace loads the motion shell and mobile workspace', () => {
  const html = fs.readFileSync('public/index.html', 'utf8');
  assert.match(html, /workspace-motion\.css/);
  assert.match(html, /workspace-motion\.js/);
  assert.match(html, /data-workspace-shell/);
});

test('workspace motion stylesheet defines reusable app motion states', () => {
  const css = fs.readFileSync('public/workspace-motion.css', 'utf8');
  assert.match(css, /--cv-motion-fast/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /\.cv-workspace-nav/);
  assert.match(css, /\.cv-command/);
  assert.match(css, /\.cv-mobile-bar/);
});

test('workspace motion controller exposes builder navigation behavior', () => {
  const js = fs.readFileSync('public/workspace-motion.js', 'utf8');
  assert.match(js, /dataset\.workspaceNav/);
  assert.match(js, /dataset\.command/);
  assert.match(js, /matchMedia/);
  assert.match(js, /IntersectionObserver/);
});
