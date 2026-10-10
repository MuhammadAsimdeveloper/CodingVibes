import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { auditProductExperience } from '../src/agent/product-quality.js';
import { auditGeneratedSite, GENERATED_SITE_REQUIREMENTS } from '../src/verification/generated-site-quality.js';

const goodHtml = ({title='Home',description='A useful description for this public website route that explains the value to its intended visitors.', extra='' }={}) => `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><meta name="description" content="${description}"><link rel="canonical" href="https://example.test/"><link rel="icon" href="/favicon.svg"><meta property="og:image" content="https://example.test/social.png"></head><body><main><h1>Welcome</h1><a class="primary-cta" href="/contact">Get started</a><img src="/hero.webp" alt="A team collaborating"><form><label for="email">Email</label><input id="email" type="email" required><button type="submit">Send</button><p role="alert"></p></form>${extra}</main></body></html>`;

test('exports a stable, complete list of the 20 launch requirements',()=>{
  assert.equal(GENERATED_SITE_REQUIREMENTS.length,21);
  assert.equal(new Set(GENERATED_SITE_REQUIREMENTS.map(item=>item.id)).size,20);
  assert.ok(GENERATED_SITE_REQUIREMENTS.every(item=>item.id&&item.label&&item.severity));
});

test('reports verifiable public SEO, image and form evidence without overclaiming site readiness',()=>{
  const report=auditGeneratedSite({
    files:{
      'public/index.html':goodHtml(),
      'public/contact.html':goodHtml({title:'Contact',extra:'<p>Contact our team</p>'}),
      'public/404.html':goodHtml({title:'Page not found',extra:'<h1>Page not found</h1>'}),
      'public/styles.css':'@media (max-width: 640px) { .primary-cta { display:block } }',
      'public/robots.txt':'User-agent: *\nAllow: /\nSitemap: https://example.test/sitemap.xml',
      'public/sitemap.xml':'<urlset><url><loc>https://example.test/</loc></url></urlset>',
      'public/terms.html':goodHtml({title:'Terms'}),
      'public/privacy.html':goodHtml({title:'Privacy'}),
      'public/favicon.svg':'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"></svg>',
      'public/social.png':{sizeBytes:12000,contentType:'image/png',width:1200,height:630},
      'public/hero.webp':{sizeBytes:80000,contentType:'image/webp',width:1600,height:900},
    },
    baseUrl:'https://example.test',
    config:{contactAddress:'owner supplied address',analyticsConfigured:true,analyticsConsentAware:true,cookieConsentImplemented:true,thankYouRoute:'/thank-you',stickyMobileCtaImplemented:true,ctaAboveFoldVerified:true}
  });
  assert.equal(report.requirements.length,21);
  assert.equal(report.summary.total,21);
  assert.ok(['PASS','FAIL','NEEDS_INPUT','NOT_APPLICABLE'].includes(report.requirements.find(item=>item.id==='meta-title').status));
  assert.equal(report.requirements.find(item=>item.id==='meta-title').status,'PASS');
  assert.equal(report.requirements.find(item=>item.id==='meta-description').status,'PASS');
  assert.equal(report.requirements.find(item=>item.id==='robots-txt').status,'PASS');
  assert.equal(report.requirements.find(item=>item.id==='sitemap-xml').status,'PASS');
  assert.equal(report.requirements.find(item=>item.id==='image-alt').status,'PASS');
  assert.equal(report.requirements.find(item=>item.id==='contact-address').status,'PASS');
  assert.equal(report.version,'generated-site-quality.v1');
});

test('does not mistake missing evidence for a pass and blocks critical failures',()=>{
  const report=auditGeneratedSite({files:{'public/index.html':'<html><body>Hello</body></html>'}});
  assert.equal(report.requirements.find(item=>item.id==='meta-title').status,'FAIL');
  assert.equal(report.requirements.find(item=>item.id==='contact-address').status,'NEEDS_INPUT');
  assert.equal(report.requirements.find(item=>item.id==='analytics').status,'NEEDS_INPUT');
  assert.equal(report.publishable,false);
  assert.ok(report.summary.fail>0);
});

test('marks non-applicable sticky CTA and analytics explicitly rather than silently passing',()=>{
  const report=auditGeneratedSite({
    files:{'public/index.html':goodHtml()},
    config:{siteGoal:'documentation',analyticsEnabled:false,contactAddress:'',stickyMobileCtaImplemented:false}
  });
  assert.equal(report.requirements.find(item=>item.id==='sticky-mobile-cta').status,'NOT_APPLICABLE');
  assert.equal(report.requirements.find(item=>item.id==='analytics').status,'NOT_APPLICABLE');
});

test('product-quality evidence includes the generated-site report for web targets',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'build-vibe-quality-evidence-'));
  const pub=path.join(root,'public');
  fs.mkdirSync(pub,{recursive:true});
  try {
    fs.writeFileSync(path.join(pub,'index.html'),goodHtml({extra:'<aside data-cookie-consent><button data-cookie-accept>Accept</button><button data-cookie-reject>Reject</button><button data-cookie-settings>Preferences</button></aside><aside data-sticky-cta><a href="/contact"><strong>Let us talk</strong></a><button data-dismiss-sticky-cta>Close</button></aside>'}));
    fs.writeFileSync(path.join(pub,'404.html'),goodHtml({title:'Page not found'}));
    fs.writeFileSync(path.join(pub,'privacy.html'),goodHtml({title:'Privacy'}));
    fs.writeFileSync(path.join(pub,'terms.html'),goodHtml({title:'Terms'}));
    fs.writeFileSync(path.join(pub,'styles.css'),'.sticky-mobile-cta{display:none}@media (max-width: 640px) { .sticky-mobile-cta { position:fixed } main { padding: 1rem; } }');
    fs.writeFileSync(path.join(pub,'app.js'),"sessionStorage.setItem('build-vibe-sticky-cta-dismissed','1');");
    fs.writeFileSync(path.join(pub,'favicon.svg'),'<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    fs.writeFileSync(path.join(pub,'manifest.webmanifest'),JSON.stringify({icons:[{src:'/favicon.svg',sizes:'any',type:'image/svg+xml'}]}));
    fs.writeFileSync(path.join(pub,'cookie-consent.js'),"localStorage.setItem('build-vibe-cookie-preferences-v1','{}');document.dispatchEvent(new CustomEvent('buildvibe:consentchange'));");
    fs.writeFileSync(path.join(pub,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: https://example.test/sitemap.xml');
    fs.writeFileSync(path.join(pub,'sitemap.xml'),'<urlset><url><loc>https://example.test/</loc></url></urlset>');
    const quality=auditProductExperience(root,{target:{id:'web-node'},siteKind:'business',pages:['/']});
    assert.equal(quality.generatedSiteQuality.version,'generated-site-quality.v1');
    assert.equal(quality.generatedSiteQuality.summary.total,20);
    assert.equal(quality.generatedSiteQuality.requirements.find(item=>item.id==='cookie-consent').status,'PASS');
    assert.equal(quality.generatedSiteQuality.requirements.find(item=>item.id==='favicon-set').status,'PASS');
    assert.equal(quality.generatedSiteQuality.requirements.find(item=>item.id==='sticky-mobile-cta').status,'PASS');
  } finally {
    fs.rmSync(root,{recursive:true,force:true});
  }
});

test('customer analytics stays NEEDS_INPUT until browser delivery and consent evidence pass',()=>{
  const files={
    'public/index.html':goodHtml(),
    'public/analytics-consent.js':'const config={"provider":"google-analytics","measurementId":"G-ABCDEF1234"};document.addEventListener("buildvibe:consentchange",()=>{});const mode="analytics_storage";'
  };
  const unverified=auditGeneratedSite({files,config:{analyticsEnabled:true,analyticsConsentAware:true,analyticsDeliveryVerified:false}});
  assert.equal(unverified.requirements.find(item=>item.id==='analytics').status,'NEEDS_INPUT');
  assert.equal(unverified.requirements.find(item=>item.id==='analytics').severity,'critical');
  const verified=auditGeneratedSite({files,config:{analyticsEnabled:true,analyticsConsentAware:true,analyticsDeliveryVerified:true}});
  assert.equal(verified.requirements.find(item=>item.id==='analytics').status,'PASS');
});

test('business address is a production blocker when required and missing',()=>{
  const files={'public/index.html':goodHtml()};
  const missing=auditGeneratedSite({files,config:{requireContactAddress:true}});
  const missingAddress=missing.requirements.find(item=>item.id==='contact-address');
  assert.equal(missingAddress.status,'NEEDS_INPUT');
  assert.equal(missingAddress.severity,'critical');
  assert.equal(missing.publishable,false);
  const supplied=auditGeneratedSite({files,config:{requireContactAddress:true,contactAddress:'18 Market Road, Lahore, Punjab, Pakistan'}});
  assert.equal(supplied.requirements.find(item=>item.id==='contact-address').status,'PASS');
  const notRequired=auditGeneratedSite({files,config:{requireContactAddress:false}});
  assert.equal(notRequired.requirements.find(item=>item.id==='contact-address').status,'NOT_APPLICABLE');
});

test('accessibility basics require document language, a main landmark and accessible form names',()=>{
  const report=auditGeneratedSite({files:{
    'public/index.html':goodHtml(),
    'public/contact.html':'<!doctype html><html><head><title>Contact</title><meta name="description" content="A useful description for this public website route that explains the value to its intended visitors."></head><body><h1>Contact</h1><form><input type="email"><button>Send</button></form></body></html>'
  },config:{analyticsEnabled:false,requireContactAddress:false}});
  const check=report.requirements.find(item=>item.id==='accessibility-basics');
  assert.ok(check,'accessibility basics should be part of the generated-site quality report');
  assert.equal(check.status,'FAIL');
  assert.ok(check.evidence.some(item=>/language/i.test(item)));
  assert.ok(check.evidence.some(item=>/main landmark/i.test(item)));
  assert.ok(check.evidence.some(item=>/form control/i.test(item)));
});

test('accessibility basics pass when public pages declare language, main landmarks and associated labels',()=>{
  const report=auditGeneratedSite({files:{
    'public/index.html':goodHtml(),
    'public/contact.html':goodHtml({title:'Contact'})
  },config:{analyticsEnabled:false,requireContactAddress:false}});
  assert.equal(report.requirements.find(item=>item.id==='accessibility-basics').status,'PASS');
});
