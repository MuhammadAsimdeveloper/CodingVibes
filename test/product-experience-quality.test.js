import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { inferDesignSystem } from '../src/agent/design-system.js';
import { listTemplates } from '../src/templates/catalog.js';
import { analyzeRequirements } from '../src/agent/requirements.js';
import { generateProject } from '../src/agent/project-generator.js';
import { applyExperienceQuality } from '../src/agent/experience-quality.js';
import { generateTargetFallback } from '../src/targets/generator.js';
import { getTarget } from '../src/targets/registry.js';

test('polished motion is available by default but reduced motion remains explicit',()=>{
  const system=inferDesignSystem('Build a modern business website',{style:'modern',animation:false,gradients:false,glass:false,threeD:false,canvas:false,density:'comfortable'});
  assert.equal(system.motion.mode,'smooth');
  assert.equal(system.accessibility.reducedMotion,true);
  const staticSystem=inferDesignSystem('Build a static site with no animation',{style:'minimal',animation:false});
  assert.equal(staticSystem.motion.mode,'reduced');
});

test('template catalog exposes distinct motion directions for non-3D and 3D experiences',()=>{
  const templates=listTemplates();
  assert.ok(templates.length>=60);
  const threeD=templates.find(t=>t.experience==='3d');
  const twoD=templates.find(t=>t.experience==='motion');
  assert.ok(threeD?.motion?.scene);
  assert.ok(threeD?.motion?.webglFallback);
  assert.ok(twoD?.motion?.transition);
  assert.equal(threeD.motion.transition,'shared-camera');
  assert.equal(twoD.motion.scene,false);
  assert.notEqual(threeD.motion.transition,twoD.motion.transition);
});

test('deterministic generated websites ship a local dependency-free motion runtime',()=>{
  const spec=analyzeRequirements('Create a premium hotel website with rooms, booking, gallery, testimonials and contact');
  const plan=generateProject(spec);
  const files=new Map(plan.files.map(f=>[f.path,f.content]));
  assert.ok(files.has('public/motion.js'));
  assert.match(files.get('public/motion.js'),/IntersectionObserver/);
  assert.match(files.get('public/index.html'),/data-motion=/);
  assert.match(files.get('public/styles.css'),/prefers-reduced-motion/);
  assert.match(files.get('public/styles.css'),/motion-item/);
});

test('experience quality pass upgrades model-generated HTML without replacing its design',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'build-vibe-quality-'));
  fs.mkdirSync(path.join(root,'public'),{recursive:true});
  fs.writeFileSync(path.join(root,'public','index.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width"></head><body><main><section><h1>Custom site</h1></section></main></body></html>','utf8');
  const report=applyExperienceQuality(root,{kind:'business',mode:'smooth'});
  assert.equal(report.applied,true);
  const html=fs.readFileSync(path.join(root,'public','index.html'),'utf8');
  assert.match(html,/build-vibe-motion\.css/);
  assert.match(html,/build-vibe-motion\.js/);
  assert.equal(fs.existsSync(path.join(root,'public','build-vibe-motion.css')),true);
  assert.equal(fs.existsSync(path.join(root,'public','build-vibe-motion.js')),true);
});

test('deterministic mobile app fallback has a real product shell, not a placeholder screen',()=>{
  const spec=analyzeRequirements('Build an Android and iOS appointment booking app with profiles, calendar, notifications and payments',{targetId:'mobile-expo'});
  const plan=generateTargetFallback(spec,getTarget('mobile-expo'));
  const app=plan.files.find(f=>f.path==='App.tsx')?.content||'';
  assert.match(app,/SafeAreaView/);
  assert.match(app,/Home.*Explore.*Profile/);
  assert.match(app,/Get started/);
  assert.match(app,/Core experience/);
  assert.doesNotMatch(app,/Generated for mobile-expo/);
});

test('generated 3D website exposes accessible view controls and bounded rendering behavior',()=>{
  const spec=analyzeRequirements('Create an immersive 3D product showroom with uploaded GLB models, interactive camera views, and video walkthroughs');
  assert.equal(spec.experience?.threeD,true);
  const plan=generateProject(spec);
  const files=new Map(plan.files.map(f=>[f.path,f.content]));
  const html=files.get('public/index.html')||'';
  const runtime=files.get('public/experience.js')||'';
  assert.match(html,/id="viewLeft"[^>]+aria-label="Rotate 3D view left"/);
  assert.match(html,/id="viewRight"[^>]+aria-label="Rotate 3D view right"/);
  assert.match(html,/id="viewZoomIn"[^>]+aria-label="Zoom in to 3D view"/);
  assert.match(html,/id="experienceImageInput"/);
  assert.match(html,/id="applyExperienceTexture"/);
  assert.match(html,/id="videoInput"[^>]+accept="video\/mp4,video\/webm"/);
  assert.match(html,/id="experienceImage"[^>]+alt="Uploaded image preview for this 3D experience"/);
  assert.match(html,/id="experienceFallback"[^>]+role="status"[^>]+aria-live="polite"/);
  assert.ok(runtime.includes("prefers-reduced-motion: reduce"));
  assert.ok(runtime.includes('new TextureLoader()'));
  assert.ok(runtime.includes('applyTextureToObject(loadedModel,attachedTexture)'));
  assert.ok(runtime.includes('function disposeModelResources(root)'),'replaced GLTF resources should be disposed');
  assert.ok(runtime.includes('function stopCameraMotion()'),'camera tours should expose a cancellable motion lifecycle');
  assert.ok(runtime.includes('stopCameraMotion();clearInterval(tourTimer)')||runtime.includes('clearInterval(tourTimer);stopCameraMotion()'),'camera animation must stop when the tab is hidden');
  assert.ok(runtime.includes('attachedTexture=null,modelLoadGeneration=0'),'stale concurrent model loads should be invalidated');
  assert.ok(runtime.includes('loadGeneration!==modelLoadGeneration'),'late model loads must not replace the latest selection');
  assert.ok((runtime.includes('finally{')&&runtime.includes('URL.revokeObjectURL(ownedUrl)')),'temporary model URLs must be revoked on success and failure');
  assert.ok(runtime.includes('restoreAppliedMaterials(loadedModel||group)'));
  assert.ok(runtime.includes('sceneObserver=new IntersectionObserver'));
  assert.ok(runtime.includes("document.addEventListener('visibilitychange',handleVisibility)"));
  assert.ok(runtime.includes("controls.addEventListener('change',scheduleRender)"));
  assert.ok(!runtime.includes('preserveDrawingBuffer:true'));
  assert.match(runtime,/file\.size>20\*1024\*1024/);
  assert.match(runtime,/file\.size>100\*1024\*1024/);
  assert.match(runtime,/file\.size>150\*1024\*1024/);
  assert.match(runtime,/URL\.revokeObjectURL\(localImageUrl\)/);
  assert.match(files.get('public/styles.css')||'',/@media\(max-width:760px\)\{\.experience-stage/);
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'build-vibe-3d-'));
  const runtimePath=path.join(root,'experience.js');
  fs.writeFileSync(runtimePath,runtime,'utf8');
  const checked=spawnSync(process.execPath,['--check',runtimePath],{encoding:'utf8'});
  assert.equal(checked.status,0,checked.stderr||checked.stdout);
});

test('generated sites apply validated project design tokens and allowed text edits',()=>{
  const spec=analyzeRequirements('Create a professional business website');
  spec.styling={...(spec.styling||{}),designSystem:{
    colors:{primary:'#123abc',accent:'#abcdef',background:'#101010',surface:'#202020',text:'#fefefe',muted:'#888888',border:'#333333'},
    typography:{heading:'Georgia, serif',body:'Arial, sans-serif'},
    layout:{maxWidth:1040},radius:{md:18},motion:{durationMs:500},
    visualEdits:[
      {selector:'h1, h2, h3',css:{color:'#ff00aa',fontWeight:'700'}},
      {selector:'body',css:{backgroundColor:'#445566'}},
      {selector:'body;body',css:{color:'red;display:none'}},
      {selector:'body',css:{backgroundImage:'url(javascript:alert(1))',color:'url(javascript:alert(1))'}}
    ]
  }};
  const plan=generateProject(spec);
  const css=plan.files.find(file=>file.path==='public/styles.css').content;
  assert.match(css,/--cv-color-primary:#123abc/);
  assert.match(css,/--cv-font-heading:Georgia, serif/);
  assert.match(css,/--cv-content-width:1040px/);
  assert.match(css,/--cv-radius-md:18px/);
  assert.match(css,/--cv-motion-duration:500ms/);
  assert.ok(css.includes('h1, h2, h3{color:#ff00aa;font-weight:700}'));
  assert.ok(css.includes('body{background-color:#445566}'));
  assert.doesNotMatch(css,/body;body/);
  assert.doesNotMatch(css,/javascript:alert/);
});
