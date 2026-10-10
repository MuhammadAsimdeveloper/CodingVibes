import test from 'node:test';
import vm from 'node:vm';
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
  assert.match(css,/\.cookie-consent \[data-cookie-accept\],\.cookie-consent \[data-cookie-reject\]/,'accept and reject controls must have equal visual prominence');
  assert.match(pkg.scripts.check,/node --check public\/cookie-consent\.js/);
});

test('cookie preference runtime persists reject, custom preferences, and later changes',()=>{
  const spec=completeSpec(analyzeRequirements('Build a local service business website'));
  const files=new Map(generateProject(spec).files.map(file=>[file.path,file.content]));
  const source=files.get('public/cookie-consent.js');
  assert.ok(source,'generated cookie consent runtime should exist');
  const handlers=()=>({listeners:{},attributes:{},hidden:true,textContent:'',addEventListener(type,fn){this.listeners[type]=fn;},setAttribute(name,value){this.attributes[name]=value;},focus(){this.focused=true;}});
  const panel=handlers(),form=handlers(),status=handlers(),accept=handlers(),reject=handlers(),settings=handlers(),reopen=handlers();
  const analytics={checked:false},marketing={checked:false};
  form.elements={analytics,marketing};
  panel.querySelector=selector=>({
    '[data-cookie-preferences]':form,
    '[data-cookie-status]':status,
    '[data-cookie-accept]':accept,
    '[data-cookie-reject]':reject,
    '[data-cookie-settings]':settings
  })[selector]||null;
  const values=new Map(),events=[];
  const document={
    querySelector:selector=>selector==='[data-cookie-consent]'?panel:null,
    querySelectorAll:selector=>selector==='[data-cookie-reopen]'?[reopen]:[],
    dispatchEvent:event=>{events.push(event);return true;}
  };
  class FakeCustomEvent{constructor(type,options={}){this.type=type;this.detail=options.detail;}}
  const localStorage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
  vm.runInNewContext(source,{document,localStorage,CustomEvent:FakeCustomEvent,JSON,Boolean,String,Date});
  assert.equal(panel.hidden,false,'banner opens when no saved preference exists');
  reject.listeners.click();
  let saved=JSON.parse(values.get('build-vibe-cookie-preferences-v1'));
  assert.equal(saved.essential,true);
  assert.equal(saved.analytics,false);
  assert.equal(saved.marketing,false);
  assert.equal(panel.hidden,true);
  assert.ok(events.some(event=>event.type==='buildvibe:consentchange'&&event.detail.analytics===false));
  reopen.listeners.click();
  assert.equal(panel.hidden,false,'settings control can reopen preferences');
  assert.equal(panel.focused,true,'focus moves to the preference panel');
  settings.listeners.click({currentTarget:settings});
  assert.equal(form.hidden,false);
  assert.equal(settings.attributes['aria-expanded'],'true');
  analytics.checked=true;
  marketing.checked=true;
  let prevented=false;
  form.listeners.submit({preventDefault(){prevented=true;}});
  saved=JSON.parse(values.get('build-vibe-cookie-preferences-v1'));
  assert.equal(prevented,true);
  assert.equal(saved.analytics,true);
  assert.equal(saved.marketing,true);
  assert.equal(panel.hidden,true);
  reopen.listeners.click();
  assert.equal(analytics.checked,true,'saved analytics preference is restored');
  assert.equal(marketing.checked,true,'saved marketing preference is restored');
});

test('generated contact flow has accessible loading/error states and a noindex thank-you route',()=>{
  const spec=completeSpec(analyzeRequirements('Build a professional local plumbing business website with a contact form'));
  const files=new Map(generateProject(spec).files.map(file=>[file.path,file.content]));
  const contact=files.get('public/contact.html')||'';
  const thankYou=files.get('public/thank-you.html')||'';
  const app=files.get('public/app.js')||'';
  const sitemap=files.get('public/sitemap.xml')||'';
  assert.ok(thankYou,'generated contact flow needs a thank-you page');
  assert.match(thankYou,/<meta name="robots" content="noindex,nofollow">/);
  assert.match(thankYou,/Thank you for your interest/i);
  assert.match(contact,/id="contactError"[^>]*role="alert"/);
  assert.match(contact,/id="contactResult"[^>]*role="status"/);
  assert.match(contact,/aria-describedby="contactResult contactError"/);
  assert.match(app,/aria-busy/);
  assert.match(app,/button\.disabled=true/);
  assert.match(app,/window\.location\.assign\('\/thank-you'\)/);
  assert.doesNotMatch(sitemap,/__SITE_URL__\/thank-you/);
});

test('generated customer pages provide a dismissible mobile-only primary contact CTA',()=>{
  const spec=completeSpec(analyzeRequirements('Build a professional local plumbing business website with a contact form'));
  const files=new Map(generateProject(spec).files.map(file=>[file.path,file.content]));
  const home=files.get('public/index.html')||'';
  const app=files.get('public/app.js')||'';
  const css=files.get('public/styles.css')||'';
  assert.ok(home.includes('class="primary-cta" data-primary-cta href="/contact">Get started'));
  assert.match(home,/data-sticky-cta/);
  assert.match(home,/href="\/contact"[^>]*>[^<]*<strong>Let's talk<\/strong>/);
  assert.match(home,/data-dismiss-sticky-cta/);
  assert.match(app,/build-vibe-sticky-cta-dismissed/);
  assert.match(css,/\.sticky-mobile-cta/);
  assert.match(css,/@media\(max-width:640px\)[\s\S]*\.sticky-mobile-cta/);
});

test('customer analytics is optional and its script loads only after explicit analytics consent',()=>{
  const base=analyzeRequirements('Build a professional local service website with a contact form');
  const unconfigured=new Map(generateProject(completeSpec(base)).files.map(file=>[file.path,file.content]));
  assert.match(unconfigured.get('public/analytics-consent.js'),/const config=null/);
  const spec=completeSpec({...base,analytics:{provider:'google-analytics',measurementId:'G-ABCDEF1234'}});
  const files=new Map(generateProject(spec).files.map(file=>[file.path,file.content]));
  const source=files.get('public/analytics-consent.js');
  assert.match(source,/G-ABCDEF1234/);
  assert.match(source,/buildvibe:consentchange/);
  assert.match(source,/googletagmanager\.com\/gtag\/js/);
  assert.match(files.get('public/index.html'),/analytics-consent\.js/);
  assert.doesNotMatch(files.get('public/index.html'),/googletagmanager\.com/);
  const listeners={},scripts=[],values=new Map([['build-vibe-cookie-preferences-v1',JSON.stringify({version:1,essential:true,analytics:false,marketing:false})]]);
  const window={};
  const document={addEventListener:(type,handler)=>{listeners[type]=handler;},createElement:()=>({}),head:{appendChild:script=>scripts.push(script)}};
  const localStorage={getItem:key=>values.get(key)||null};
  vm.runInNewContext(source,{window,document,localStorage,JSON,Boolean,String,Date,encodeURIComponent});
  assert.equal(scripts.length,0,'analytics script must not load without consent');
  assert.equal(window['ga-disable-G-ABCDEF1234'],true,'collection must start disabled');
  listeners['buildvibe:consentchange']({detail:{analytics:true}});
  assert.equal(window['ga-disable-G-ABCDEF1234'],false,'explicit consent enables collection');
  assert.equal(scripts.length,1,'analytics script loads after consent');
  assert.match(scripts[0].src,/googletagmanager\.com\/gtag\/js\?id=G-ABCDEF1234/);
  listeners['buildvibe:consentchange']({detail:{analytics:false}});
  assert.equal(window['ga-disable-G-ABCDEF1234'],true,'revocation disables collection');
  assert.ok(window.dataLayer.some(entry=>entry[0]==='consent'&&entry[1]==='update'&&entry[2]?.analytics_storage==='denied'),'revocation must update consent to denied');
});
