import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=()=>fs.readFileSync('public/landing.html','utf8');
const css=()=>fs.readFileSync('public/landing.css','utf8');
const js=()=>fs.readFileSync('public/landing.js','utf8');

test('landing experience has the complete product narrative and conversion surfaces',()=>{
  const h=html();
  for(const token of ['AI PRODUCT BUILDER','Imagine it.','Build it.','Verify it.','Ship it.','Build any website or app','Create your first project','How it works','Built for real products','Plans that scale with you','Frequently asked questions']) assert.ok(h.includes(token),token);
  assert.ok(h.includes('href="/app"'));
  assert.ok(h.includes('data-reveal'));
  assert.ok(h.includes('data-demo-stage'));
});

test('landing styling defines motion, depth, responsive layout and reduced-motion support',()=>{
  const c=css();
  for(const token of ['@keyframes','animation:','backdrop-filter','@media (prefers-reduced-motion: reduce)','@media (max-width: 900px)']) assert.ok(c.includes(token),token);
});

test('landing script exposes interactive demo, reveal observer and mobile nav behavior',()=>{
  const j=js();
  for(const token of ['IntersectionObserver','data-demo-stage','classList.toggle','matchMedia']) assert.ok(j.includes(token),token);
});
