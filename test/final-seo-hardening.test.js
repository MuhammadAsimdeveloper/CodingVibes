import test from 'node:test';
import assert from 'node:assert/strict';
import {renderPublicSeoPage} from '../src/seo/public-pages.js';
import {generateProject} from '../src/agent/project-generator.js';
import fs from 'node:fs';

test('public SEO pages emit final social and author metadata',()=>{
  const html=renderPublicSeoPage('/ai-website-builder',{baseUrl:'https://example.com'});
  assert.match(html,/<meta name="author" content="Build Vibe">/);
  assert.match(html,/property="og:image:type" content="image\/svg\+xml"/);
  assert.match(html,/property="og:image:width" content="1200"/);
  assert.match(html,/property="og:image:height" content="630"/);
  assert.match(html,/name="twitter:image:alt"/);
  assert.match(html,/"@type":"Organization"/);
  assert.match(html,/"@type":\["SoftwareApplication","WebApplication"\]/);
  assert.match(html,/"@type":"WebPage"/);
});

test('generated public pages emit author and Twitter image-alt metadata',()=>{
  const spec={
    request:'Create a professional consulting website',
    siteKind:'business',
    siteTemplateLabel:'Northstar Consulting',
    siteDescription:'Strategy and operations consulting for growing companies.',
    pages:['/','/services','/about'],
    apis:[],
    components:['services','team','contact'],
    dataModel:[{name:'services'}],
    behavior:{adminPortal:true,ownerOnlyAdmin:true,publicLogin:false,search:false,payments:false},
    styling:{visual:{threeD:false}},
    experience:{threeD:false},
  };
  const plan=generateProject(spec);
  const home=plan.files.find(x=>x.path==='public/index.html')?.content||'';
  assert.match(home,/name="author"/);
  assert.match(home,/name="twitter:image:alt"/);
  assert.match(home,/"@type":"Organization"/);
  assert.match(home,/"@type":"WebPage"/);
});

test('release metadata and host startup are wired',async()=>{
  const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
  assert.equal(pkg.scripts['seo:check'],'node scripts/seo-check.mjs');
  assert.equal(pkg.scripts['start:host'],'node scripts/start-host.mjs');
});
