import test from 'node:test';
import assert from 'node:assert/strict';
import { auditGeneratedSite, GENERATED_SITE_REQUIREMENTS } from '../src/verification/generated-site-quality.js';

const goodHtml = ({title='Home',description='A useful description for this public website route that explains the value to its intended visitors.', extra='' }={}) => `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><meta name="description" content="${description}"><link rel="canonical" href="https://example.test/"><link rel="icon" href="/favicon.svg"><meta property="og:image" content="https://example.test/social.png"></head><body><main><h1>Welcome</h1><a class="primary-cta" href="/contact">Get started</a><img src="/hero.webp" alt="A team collaborating"><form><label for="email">Email</label><input id="email" type="email" required><button type="submit">Send</button><p role="alert"></p></form>${extra}</main></body></html>`;

test('exports a stable, complete list of the 20 launch requirements',()=>{
  assert.equal(GENERATED_SITE_REQUIREMENTS.length,20);
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
  assert.equal(report.requirements.length,20);
  assert.equal(report.summary.total,20);
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
