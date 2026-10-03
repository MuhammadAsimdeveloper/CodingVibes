import test from 'node:test';
import assert from 'node:assert/strict';
import {getTemplate,searchTemplates} from '../src/templates/catalog.js';
import {recipeForExperience} from '../src/agent/experience-recipes.js';
import {analyzeRequirements} from '../src/agent/requirements.js';
import {generateProject} from '../src/agent/project-generator.js';

test('template catalog exposes curated basic and premium experiences',()=>{
  const templates=searchTemplates('');
  assert.ok(templates.length>=25);
  assert.equal(getTemplate('real-estate-3d-tour').tier,'pro');
  assert.equal(getTemplate('real-estate-3d-tour').features.includes('advanced_animation'),true);
  assert.equal(getTemplate('creator-portfolio').tier,'free');
});

test('property tour prompt creates a real experience contract',()=>{
  const spec=analyzeRequirements('Build a real estate website with a 3D interactive house walkthrough, room hotspots, floor plan and video tour.');
  assert.equal(spec.experience.type,'property-tour');
  assert.equal(spec.experience.propertyTour,true);
  assert.equal(spec.experience.videoPlayback,true);
  assert.ok(spec.acceptance.some(x=>x.includes('3D property experience')));
  assert.equal(recipeForExperience(spec.experience).renderer,'three.js@0.186.1');
});

test('generated property tour contains the reusable 3D runtime',()=>{
  const spec=analyzeRequirements('Create an immersive property 3D virtual tour for a luxury home with camera tour and video walkthrough.');
  const plan=generateProject(spec);
  const runtime=plan.files.find(x=>x.path==='public/experience.js');
  const home=plan.files.find(x=>x.path==='public/index.html');
  assert.ok(runtime);
  assert.match(runtime.content,/OrbitControls/);
  assert.match(runtime.content,/GLTFLoader/);
  assert.match(runtime.content,/MediaRecorder/);
  assert.match(home.content,/modelInput/);
  assert.match(home.content,/tourVideo/);
});
