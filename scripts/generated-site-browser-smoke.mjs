import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { analyzeRequirements, completeSpec } from '../src/agent/requirements.js';
import { generateProject, materializeProject } from '../src/agent/project-generator.js';
import { browserSmoke } from '../src/verification/playwright.js';
import { httpSmoke } from '../src/verification/http.js';
import { auditProductExperience } from '../src/agent/product-quality.js';

const root=fs.mkdtempSync(path.join(os.tmpdir(),'build-vibe-site-browser-smoke-'));
const spec=completeSpec({
  ...analyzeRequirements('Build a professional local plumbing business website with a contact form. Business address is 18 Market Road, Lahore, Punjab, Pakistan. Install Google Analytics G-ABCDEF1234 after consent.'),
  contactAddress:'18 Market Road, Lahore, Punjab, Pakistan',
  analytics:{provider:'google-analytics',measurementId:'G-ABCDEF1234'}
});
materializeProject(generateProject(spec),root);
const portServer=net.createServer();
await new Promise((resolve,reject)=>{portServer.once('error',reject);portServer.listen(0,'127.0.0.1',resolve);});
const port=portServer.address().port;
await new Promise(resolve=>portServer.close(resolve));
const child=spawn(process.execPath,['app/server.js'],{
  cwd:root,
  env:{...process.env,HOST:'127.0.0.1',PORT:String(port),NODE_ENV:'test',CV_SESSION_SECRET:'build-vibe-generated-site-browser-test-secret'},
  stdio:'ignore'
});
try {
  let ready=false;
  for(let attempt=0;attempt<100;attempt++){
    if(child.exitCode!==null)throw new Error('Generated site server exited before readiness.');
    try{const response=await fetch('http://127.0.0.1:'+port+'/api/health');if(response.ok){ready=true;break;}}catch{}
    await new Promise(resolve=>setTimeout(resolve,50));
  }
  assert.equal(ready,true,'generated site server should become ready');
  const baseUrl='http://127.0.0.1:'+port;
  const http=await httpSmoke(baseUrl,[{path:'/__build_vibe_quality_404_check__',method:'GET',expectedStatus:404}]);
  assert.equal(http.passed,true,'unknown route should return HTTP 404');
  const browser=await browserSmoke(baseUrl,['/','/contact','/thank-you','/privacy','/terms'],{
    screenshots:false,
    artifactDir:path.join(root,'.quality-artifacts'),
    analytics:spec.analytics
  });
  assert.equal(browser.available,true,'Playwright must be available for this browser gate');
  assert.equal(browser.passed,true,'generated website browser smoke should pass: '+JSON.stringify(browser.results.map(item=>({path:item.path,ok:item.ok,error:item.error,consoleErrors:item.consoleErrors,uiFailures:item.uiFailures}))));
  const home=browser.results.find(item=>item.path==='/')?.interactions||{};
  const contact=browser.results.find(item=>item.path==='/contact')?.interactions||{};
  assert.equal(home.ctaAboveFoldVerified,true,'primary CTA should be visible above the fold: '+JSON.stringify(home.ctaAboveFoldDetails));
  assert.equal(home.cookieConsentVerified,true,'cookie consent preferences should work');
  assert.equal(home.stickyMobileCtaVerified,true,'sticky mobile CTA should be visible and dismissible');
  assert.equal(home.analyticsConsentGateVerified,true,'analytics should load only after consent and stop collection on revocation');
  assert.equal(contact.formErrorsVerified,true,'form error/retry should work');
  assert.equal(contact.loadingStatesVerified,true,'form loading state should be visible');
  assert.equal(contact.thankYouRuntimeVerified,true,'successful submit should redirect to noindex thank-you page');
  const productQuality=auditProductExperience(root,spec,{runtimeEvidence:{
    http404Verified:http.results.some(item=>item.status===404&&item.ok),
    ctaAboveFoldVerified:home.ctaAboveFoldVerified,
    cookieConsentImplemented:home.cookieConsentVerified,
    stickyMobileCtaImplemented:home.stickyMobileCtaVerified,
    analyticsEnabled:true,
    analyticsConsentAware:home.analyticsConsentGateVerified,
    analyticsDeliveryVerified:home.analyticsConsentGateVerified,
    formErrorsVerified:contact.formErrorsVerified,
    loadingStatesVerified:contact.loadingStatesVerified,
    thankYouRuntimeVerified:contact.thankYouRuntimeVerified
  }});
  assert.equal(productQuality.generatedSiteQuality.publishable,true,'fully configured fixture should pass critical generated-site quality gate: '+JSON.stringify(productQuality.generatedSiteQuality.requirements.filter(item=>item.severity==='critical'&& !['PASS','NOT_APPLICABLE'].includes(item.status))));
  process.stdout.write('Generated-site browser quality gate passed: CTA, consent, analytics, mobile CTA, form recovery, 404, contact address, and thank-you flow.\n');
} finally {
  child.kill('SIGTERM');
  await Promise.race([once(child,'exit'),new Promise(resolve=>setTimeout(resolve,1000))]);
  fs.rmSync(root,{recursive:true,force:true});
}
