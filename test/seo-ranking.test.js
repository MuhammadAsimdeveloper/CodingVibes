import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSeoRoute,scoreSeoRoute,auditSeoSite,buildTopicPlan} from '../src/seo/ranking.js';

test('normalizes SEO route metadata without accepting unsafe URLs or arbitrary robots values',()=>{
  const seo=normalizeSeoRoute({
    path:'/services',
    title:'Northstar Consulting — Strategy Services',
    description:'Independent strategy and operations consulting for growing SaaS and professional services teams.',
    canonical:'https://example.com/services',
    robots:'index,follow',
    focusTopic:'strategy consulting',
    searchIntent:'commercial',
    ogImage:'/og-default.svg',
    author:'Northstar Consulting'
  },'https://example.com');
  assert.equal(seo.canonical,'https://example.com/services');
  assert.equal(seo.robots,'index,follow');
  assert.equal(seo.searchIntent,'commercial');
  assert.throws(()=>normalizeSeoRoute({path:'/x',canonical:'javascript:alert(1)'}),'unsafe_canonical');
});

test('scores a search-ready page and exposes actionable deficits instead of claiming a ranking guarantee',()=>{
  const strong=scoreSeoRoute({
    path:'/',
    title:'AI Website Builder for Verified Sites | Build Vibe',
    description:'Build a real website from natural language with visual editing, verification, SEO and portable publishing.',
    canonical:'https://buildvibe.example/',
    robots:'index,follow,max-image-preview:large',
    inSitemap:true,
    h1Count:1,
    wordCount:1100,
    internalLinks:9,
    inboundLinks:3,
    orphan:false,
    structuredData:{valid:true,types:['WebSite','Organization','SoftwareApplication','WebPage']},
    images:{count:4,missingAlt:0,missingDimensions:0},
    performance:{transferBytes:280000,jsBytes:85000,lcpMs:1800,cls:0.04,inpMs:130},
    content:{uniqueRatio:0.96,hasAnswerSummary:true,hasAuthor:true,hasUpdatedAt:true}
  });
  assert.equal(strong.score>=90,true);
  assert.equal(strong.grade,'A');
  assert.equal(strong.rankingClaim,false);
  assert.equal(strong.recommendations.length,0);

  const weak=scoreSeoRoute({path:'/x',title:'Home',description:'Short',canonical:'relative',h1Count:3,wordCount:120,internalLinks:0,orphan:true,structuredData:{valid:false,types:[]},images:{count:2,missingAlt:2},performance:{transferBytes:4000000,jsBytes:900000}});
  assert.equal(weak.score<60,true);
  assert.equal(weak.recommendations.length>0,true);
});

test('audits duplicates, orphan pages, broken internal links and sitemap coverage',()=>{
  const report=auditSeoSite({
    baseUrl:'https://example.com',
    pages:[
      {path:'/',title:'Example Home',description:'A detailed homepage description for the product and its audience.',canonical:'https://example.com/',robots:'index,follow',h1Count:1,internalLinks:['/docs'],structuredData:{valid:true,types:['WebSite']}},
      {path:'/docs',title:'Example Home',description:'A detailed homepage description for the product and its audience.',canonical:'https://example.com/docs',robots:'index,follow',h1Count:1,internalLinks:['/missing'],structuredData:{valid:true,types:['WebPage']}},
      {path:'/orphan',title:'Orphan Guide',description:'A unique description for the orphan guide page with enough context for search.',canonical:'https://example.com/orphan',robots:'index,follow',h1Count:1,internalLinks:[],structuredData:{valid:true,types:['WebPage']}}
    ],
    sitemapUrls:['https://example.com/','https://example.com/docs']
  });
  assert.equal(report.ok,false);
  assert.equal(report.issues.some(x=>x.code==='duplicate_title'),true);
  assert.equal(report.issues.some(x=>x.code==='orphan_page'),true);
  assert.equal(report.issues.some(x=>x.code==='broken_internal_link'),true);
  assert.equal(report.issues.some(x=>x.code==='sitemap_missing'),true);
  assert.equal(report.score<80,true);
});

test('topic planning favors one primary intent and bounded supporting topics',()=>{
  const plan=buildTopicPlan({
    primary:'AI website builder',
    supporting:['visual editing','verification','SEO','SEO','AI app builder',''],
    intent:'commercial'
  });
  assert.equal(plan.primaryTopic,'ai website builder');
  assert.deepEqual(plan.supportingTopics,['visual editing','verification','seo','ai app builder']);
  assert.equal(plan.useInMetaKeywords,false);
  assert.equal(plan.intent,'commercial');
});
