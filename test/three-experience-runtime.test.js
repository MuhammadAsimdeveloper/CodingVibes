import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const runtime = readFileSync(new URL('../src/templates/runtime/three-experience.js', import.meta.url), 'utf8');

test('3D experience binds to the live reduced-motion preference', () => {
  assert.match(runtime, /const motionQuery=window\.matchMedia\?\.\('\(prefers-reduced-motion: reduce\)'\)/);
  assert.match(runtime, /controls\.enableDamping=!reducedMotion/);
  assert.match(runtime, /Tour recording is paused while reduced motion is enabled/);
  assert.match(runtime, /Camera tour is paused while reduced motion is enabled/);
});

test('3D experience renders on demand instead of running a permanent loop for reduced-motion users', () => {
  assert.match(runtime, /if\(!reducedMotion\)renderFrame=requestAnimationFrame\(render\)/);
  assert.match(runtime, /document\.addEventListener\('visibilitychange',onVisibilityChange\)/);
  assert.match(runtime, /if\(reducedMotion\|\|document\.hidden\)/);
  assert.match(runtime, /clearInterval\(tourTimer\);tourTimer=null/);
  assert.match(runtime, /motionQuery\?\.addListener\?\.\(onMotionChange\)/);
});
