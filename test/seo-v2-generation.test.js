import test from 'node:test';
import assert from 'node:assert/strict';
import {createDefaultSiteContent,normalizeSiteContent} from '../src/site/content.js';
import {generateProject} from '../src/agent/project-generator.js';

test('site content stores bounded search-intent SEO fields',()=>{
  const content=createDefaultSiteContent({kind:'content',request:'Build a local tech magazine'});
  const normalized=normalizeSiteContent({
    ...content,
    seo:{
      title:'Local Tech Magazine | Latest Engineering Guides',
      description:'Practical engineering guides, product stories and local technology news for builders.',
      canonical:'https://example.com/',
      image:'/og-default.svg',
      focusTopic:'engineering guides',
      topics:['engineering guides','developer tools','AI apps'],
      searchIntent:'informational',
      author:'Build Vibe Editorial',
      modifiedAt:'2026-10-06T00:00:00Z'
    }
  },'content');
  assert.equal(normalized.seo.focusTopic,'engineering guides');
  assert.deepEqual(normalized.seo.topics,['engineering guides','developer tools','AI apps']);
  assert.equal(normalized.seo.searchIntent,'informational');
  assert.equal(normalized.seo.author,'Build Vibe Editorial');
});

test('content normalization rejects unsafe SEO URL schemes and robots directives',()=>{
  const normalized=normalizeSiteContent({
    seo:{
      canonical:'javascript:alert(1)',
      image:'data:text/html,<script>alert(1)</script>',
      robots:'index,<script>,nofollow',
      searchIntent:'commercial'
    }
  },'business');
  assert.equal(normalized.seo.canonical,'');
  assert.equal(normalized.seo.image,'');
  assert.equal(normalized.seo.robots,'index');
});
test('generated HTML includes SEO v2 signals and qualifying content schemas',()=>{
  const spec={
    request:'Create a content website with a blog, author profiles and SEO-ready articles',
    siteKind:'content',
    siteTemplateLabel:'Northstar Journal',
    siteDescription:'A practical technology journal for builders and product teams.',
    pages:['/','/blog','/about','/admin','/login'],
    apis:[],
    components:['blog','authors'],
    dataModel:[{name:'posts'},{name:'authors'}],
    behavior:{adminPortal:true,ownerOnlyAdmin:true,publicLogin:true,search:false,payments:false},
    styling:{visual:{threeD:false}},
    experience:{threeD:false},
    seo:{title:'Northstar Journal | Technology for Builders',description:'Practical technology stories, guides and product lessons for builders and teams.',searchIntent:'informational',focusTopic:'technology guides',topics:['technology guides','AI app development']}
  };
  const plan=generateProject(spec);
  const home=plan.files.find(x=>x.path==='public/index.html')?.content||'';
  const blog=plan.files.find(x=>x.path==='public/blog.html')?.content||'';
  assert.match(home,/name="twitter:card"/);
  assert.match(home,/property="og:locale"/);
  assert.match(home,/name="robots" content="index,follow/);
  assert.match(home,/rel="canonical"/);
  assert.match(home,/data-seo-intent="informational"/);
  assert.match(blog,/Blog/);
  assert.match(blog,/ItemList/);
  const admin=plan.files.find(x=>x.path==='public/admin.html')?.content||'';
  assert.match(admin,/noindex,nofollow/);
});
