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
