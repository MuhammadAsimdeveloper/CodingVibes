import test from 'node:test';
import assert from 'node:assert/strict';
import { DESIGN_GUIDANCE_SOURCE, getDesignGuidance, renderDesignGuidance } from '../src/agent/design-guidance.js';

test('design guidance records a pinned upstream source and local version',()=>{
  assert.equal(DESIGN_GUIDANCE_SOURCE.repository,'nextlevelbuilder/ui-ux-pro-max-skill');
  assert.equal(DESIGN_GUIDANCE_SOURCE.commit,'50d8a7de0900119855614541f15a1a616691eb33');
  assert.equal(DESIGN_GUIDANCE_SOURCE.license,'MIT');
  assert.ok(DESIGN_GUIDANCE_SOURCE.version);
});

test('guidance retrieval combines product, style and stack rules with hard overrides',()=>{
  const guidance=getDesignGuidance({productType:'3D product showcase',style:'futuristic',stack:'web-node',intent:'interactive product model'});
  assert.equal(guidance.productType,'3d-showcase');
  assert.equal(guidance.style,'futuristic');
  assert.equal(guidance.stack,'web-node');
  for(const rule of ['No purple gradients','No fabricated customer proof','No cursor-following effects','No excessive scroll-linked animation','Provide a non-WebGL fallback','Keep 3D camera movement user-controlled']) assert.ok(guidance.rules.includes(rule),rule);
  assert.match(renderDesignGuidance(guidance),/Design guidance version/);
  assert.match(renderDesignGuidance(guidance),/pinned upstream commit/);
});

test('all supported product categories receive responsive, truthful and accessible defaults',()=>{
  for(const productType of ['business','saas','ecommerce','portfolio','dashboard','mobile-app','3d-showcase']){
    const guidance=getDesignGuidance({productType,style:'modern',stack:'web'});
    assert.ok(guidance.rules.includes('Use semantic structure and responsive layouts'));
    assert.ok(guidance.rules.includes('Respect reduced-motion preferences'));
    assert.ok(guidance.rules.includes('Never invent metrics, testimonials or customer identities'));
    assert.ok(guidance.rules.includes('Provide explicit loading, empty, error and success states'));
  }
});

test('unknown style and stack fall back safely without weakening hard rules',()=>{
  const guidance=getDesignGuidance({productType:'unknown',style:'unknown-style',stack:'unknown-stack'});
  assert.equal(guidance.style,'modern');
  assert.equal(guidance.stack,'web');
  assert.ok(guidance.rules.includes('No purple gradients'));
  assert.ok(guidance.rules.includes('No pill-shaped buttons'));
});
