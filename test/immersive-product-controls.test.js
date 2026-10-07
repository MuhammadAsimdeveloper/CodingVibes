import test from 'node:test';
import assert from 'node:assert/strict';
import {generateProject} from '../src/agent/project-generator.js';
import {analyzeRequirements} from '../src/agent/requirements.js';

test('3D ecommerce generation exposes product variant and media controls',()=>{
 const spec=analyzeRequirements('Build a 3D ecommerce product site with color variants, product photos and video');
 const plan=generateProject({...spec,experience:{...(spec.experience||{}),threeD:true}});
 const html=plan.files.find(x=>x.path==='public/index.html')?.content||'';
 const runtime=plan.files.find(x=>x.path==='public/experience.js')?.content||'';
 assert.match(html,/data-product-variants/);
 assert.match(html,/productMediaStrip/);
 assert.match(runtime,/applyVariant/);
 assert.match(runtime,/deviceorientation/);
});
