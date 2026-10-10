import test from 'node:test';
import assert from 'node:assert/strict';
import {inferDesignSystem} from '../src/agent/design-system.js';

test('motion-first design system exposes reusable Figma-style motion tokens',()=>{
  const ds=inferDesignSystem('premium SaaS with cinematic scroll, magnetic hover and smooth transitions',{style:'modern',animation:true});
  assert.equal(ds.motion.mode,'cinematic');
  assert.equal(ds.motion.scroll,'reveal');
  assert.equal(ds.motion.hover,'lift');
  assert.ok(ds.motion.tokens.duration.base);
  assert.ok(ds.motion.tokens.easing.standard);
  assert.equal(ds.motion.accessibility.reducedMotion,true);
});

test('default palettes and interactions avoid purple accents, magnetic hover and pill buttons',()=>{
  for(const style of ['futuristic','bold','modern']){
    const system=inferDesignSystem('Build a polished professional website',{style,animation:true});
    assert.notEqual(system.palette.accent.toLowerCase(),'#8d7dff');
    assert.notEqual(system.palette.accent.toLowerCase(),'#6d5cff');
    assert.equal(system.effects.magneticHover,false);
    assert.equal(system.effects.cursorGlow,false);
    assert.equal(system.effects.parallax,false);
    assert.ok(parseFloat(system.radius)<=12);
    assert.equal(system.motion.hover,'lift');
    assert.equal(system.motion.scroll,'reveal');
  }
});

test('template motion recipes are explicit and progressive',async()=>{
  const fs=await import('../src/agent/experience-recipes.js');
  const recipes=fs.listExperienceRecipes();
  assert.ok(recipes.some(r=>r.motion?.scroll==='reveal'));
  assert.ok(recipes.every(r=>r.motion?.hover!=='magnetic'));
  assert.ok(recipes.every(r=>r.motion?.scroll!=='camera-story'));
  assert.ok(recipes.every(r=>r.performance?.preferReducedMotion===true));
});

test('generated template stylesheet contains choreographed motion primitives',async()=>{
  const {generateProject}=await import('../src/agent/project-generator.js');
  const spec={request:'premium agency website',pages:['/'],apis:[],components:['hero','work'],dataModel:[],siteKind:'agency',behavior:{},styling:{visual:{animation:true,style:'editorial'}}};
  const files=generateProject(spec).files;
  const css=files.find(f=>f.path==='public/styles.css')?.content||'';
  assert.match(css,/--motion-duration/);
  assert.match(css,/prefers-reduced-motion/);
  assert.match(css,/data-reveal/);
  assert.match(css,/transform:translate3d/);
});
