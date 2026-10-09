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

test('failed or successful local model imports release their temporary object URL',()=>{
  assert.match(runtime,/finally\s*\{\s*if\(objectUrl\)\s*URL\.revokeObjectURL\(objectUrl\)/);
});

test('empty configured camera paths fall back to a safe built-in tour',()=>{
  assert.match(runtime,/const shots=requestedShots\.length\?requestedShots:fallbackShots/);
});

test('replacing a local walkthrough video releases the previous object URL',()=>{
  assert.match(runtime,/if\(video\.dataset\.objectUrl\)URL\.revokeObjectURL\(video\.dataset\.objectUrl\)/);
  assert.match(runtime,/video\.dataset\.objectUrl=objectUrl/);
});



test('3D experience renders customer-provided labels as text rather than HTML', () => {
  assert.match(runtime, /fallback\.textContent='Loaded '\+label/);
  assert.match(runtime, /b\.textContent=h\.label\|\|h\.room\|\|'View'/);
  assert.match(runtime, /a\.textContent='Download recorded tour'/);
  assert.doesNotMatch(runtime, /\b(?:innerHTML|outerHTML)\s*=/);
  assert.doesNotMatch(runtime, /insertAdjacentHTML/);
});


test('walkthrough video uploads reject unsupported types and oversized local files before preview', () => {
  assert.match(runtime, /const allowedWalkthroughVideoTypes=new Set\(\['video\/mp4','video\/webm','video\/ogg'\]\)/);
  assert.match(runtime, /allowedWalkthroughVideoTypes\.has\(videoType\)/);
  assert.match(runtime, /file\.size>250\*1024\*1024/);
  assert.match(runtime, /video\.canPlayType\(videoType\)/);
  assert.match(runtime, /URL\.createObjectURL\(new Blob\(\[file\],\{type:videoType\}\)\)/);
});
