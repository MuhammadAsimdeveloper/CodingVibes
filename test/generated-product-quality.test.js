import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeRequirements,completeSpec} from '../src/agent/requirements.js';
import {generateProject} from '../src/agent/project-generator.js';
import {ModelRouter} from '../src/ai/router.js';

test('no-API router reports deterministic fallback availability',()=>{
  const router=new ModelRouter({CODINGVIBES_PROVIDER:'openai',OPENAI_API_KEY:''});
  const status=router.getStatus();
  assert.equal(status.configured,false);
  assert.equal(router.candidates().length,0);
});

test('underspecified customer request is completed with launch defaults',()=>{
  const spec=completeSpec(analyzeRequirements('Build a modern local plumbing business website with a contact form'));
  for(const route of ['/','/contact','/about','/privacy','/terms','/admin']) assert.ok(spec.pages.includes(route),route);
  assert.ok(spec.apis.some(x=>x.method==='POST'&&x.path==='/api/contact'));
  assert.equal(spec.behavior.launchReadyDefaults,true);
  assert.ok(spec.autoCompleted.includes('responsive UI'));
});

test('deterministic generator creates a real portable web product without a model API',()=>{
  const spec=completeSpec(analyzeRequirements('Create a premium restaurant website with menu, reservations, gallery and contact'));
  const plan=generateProject(spec);
  const files=new Map(plan.files.map(x=>[x.path,x.content]));
  for(const file of ['package.json','app/server.js','public/index.html','public/contact.html','public/privacy.html','public/terms.html','public/admin.html','public/content/site.json','public/styles.css','test/acceptance.test.js']) assert.ok(files.has(file),file);
  assert.match(files.get('public/index.html'),/data-style=/);
  assert.match(files.get('public/contact.html'),/id="contactForm"/);
  assert.match(files.get('public/contact.html'),/\/api\/contact/);
  assert.match(files.get('public/styles.css'),/data-style="luxury"|site-footer/);
  assert.match(files.get('package.json'),/node app\/server\.js/);
});

test('generated 3D routes declare the Three.js import map before dependent ES modules',()=>{
  const spec=completeSpec(analyzeRequirements('Create an immersive 3D product launch site with an interactive model'));
  spec.experience={...(spec.experience||{}),threeD:true,type:'interactive-3d'};
  const files=new Map(generateProject(spec).files.map(file=>[file.path,file.content]));
  const html=files.get('public/index.html')||'';
  const importTag='<script type="importmap">';
  const moduleTag='<script type="module" src="/experience.js"></script>';
  const importStart=html.indexOf(importTag);
  const moduleStart=html.indexOf(moduleTag);
  assert.ok(importStart>=0,'3D HTML must include a browser import map for Three.js addons');
  assert.ok(moduleStart>importStart,'the import map must precede the 3D ES module');
  const jsonStart=importStart+importTag.length;
  const jsonEnd=html.indexOf('</script>',jsonStart);
  const importMap=JSON.parse(html.slice(jsonStart,jsonEnd));
  assert.equal(importMap.imports.three,'https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js');
});


test('generated sites include a branded 404 artifact and unknown paths return HTTP 404',()=>{
  const spec=completeSpec(analyzeRequirements('Build a modern local plumbing business website with a contact form'));
  const files=new Map(generateProject(spec).files.map(file=>[file.path,file.content]));
  assert.ok(files.has('public/404.html'),'generated site must include a custom not-found page');
  assert.ok(files.has('public/manifest.webmanifest'),'all generated websites need an app manifest');
  assert.match(JSON.parse(files.get('public/manifest.webmanifest')).icons[0].src,/favicon\.svg/);
  assert.match(files.get('public/404.html'),/Page not found|page could not be found/i);
  assert.match(files.get('app/server.js'),/send\(res,404/,'unknown public routes must return HTTP 404');
});

test('generated websites ship an accessible, persistent, opt-in cookie preference manager',()=>{
  const spec=completeSpec(analyzeRequirements('Build a modern local plumbing business website with a contact form'));
  const files=new Map(generateProject(spec).files.map(file=>[file.path,file.content]));
  const home=files.get('public/index.html')||'';
  const consent=files.get('public/cookie-consent.js')||'';
  const css=files.get('public/styles.css')||'';
  const pkg=JSON.parse(files.get('package.json'));
  assert.match(home,/data-cookie-consent/);
  assert.match(home,/data-cookie-accept/);
  assert.match(home,/data-cookie-reject/);
  assert.match(home,/data-cookie-settings/);
  assert.match(home,/data-cookie-reopen/);
  assert.match(home,/cookie-consent\.js/);
  assert.match(consent,/localStorage\.setItem/);
  assert.match(consent,/buildvibe:consentchange/);
  assert.match(consent,/analytics:Boolean\(analytics\)/);
  assert.match(consent,/marketing:Boolean\(marketing\)/);
  assert.match(css,/\.cookie-consent/);
  assert.match(css,/@media\(max-width:640px\)/);
  assert.match(pkg.scripts.check,/node --check public\/cookie-consent\.js/);
});
