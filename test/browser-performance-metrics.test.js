import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeBrowserPerformanceMetrics} from '../src/verification/playwright.js';

test('browser performance metrics aggregate observed navigation, resource, LCP and CLS data without inventing INP', () => {
  const result=normalizeBrowserPerformanceMetrics({
    navigation:{duration:900,domContentLoadedEventEnd:350,requestStart:20,responseStart:140},
    paintEntries:[{name:'first-contentful-paint',startTime:275}],
    resources:[
      {name:'https://site.test/assets/app.js',initiatorType:'script',transferSize:200,encodedBodySize:180,renderBlockingStatus:'blocking'},
      {name:'https://site.test/hero.webp',initiatorType:'img',transferSize:1000,encodedBodySize:980,renderBlockingStatus:'non-blocking'},
      {name:'https://site.test/app.css',initiatorType:'link',transferSize:300,encodedBodySize:280,renderBlockingStatus:'blocking'},
      {name:'https://site.test/data.json',initiatorType:'fetch',transferSize:50,encodedBodySize:30,renderBlockingStatus:'non-blocking'}
    ],
    vitals:{lcpObserved:true,lcpMs:480,clsObserved:true,cls:0.03,interactionTimingObserved:true,interactionCount:1,interactionDurationMs:75}
  });
  assert.equal(result.navigationDurationMs,900);
  assert.equal(result.domContentLoadedMs,350);
  assert.equal(result.firstContentfulPaintMs,275);
  assert.equal(result.transferBytes,1550);
  assert.equal(result.metricsForAudit.ttfbMs,120);
  assert.equal(result.metricsForAudit.totalBytes,1550);
  assert.equal(result.metricsForAudit.jsBytes,200);
  assert.equal(result.metricsForAudit.imageBytes,1000);
  assert.equal(result.metricsForAudit.blockingRequests,2);
  assert.equal(result.metricsForAudit.lcpMs,480);
  assert.equal(result.metricsForAudit.cls,0.03);
  assert.equal(Object.hasOwn(result.metricsForAudit,'inpMs'),false);
  assert.equal(result.observedInteractionDurationMs,75);
  assert.ok(result.missingForAudit.includes('inpMs'));
  assert.equal(result.measurementStatus,'PARTIAL_MEASURED');
});

test('browser performance metrics do not call opaque cross-origin bytes a complete page-size measurement', () => {
  const result=normalizeBrowserPerformanceMetrics({
    navigation:{duration:100,requestStart:1,responseStart:20},
    resources:[
      {name:'https://cdn.example/app.js',initiatorType:'script',transferSize:0,encodedBodySize:0,renderBlockingStatus:null},
      {name:'https://site.test/app.css',initiatorType:'link',transferSize:100,encodedBodySize:80,renderBlockingStatus:'blocking'}
    ],
    paintEntries:[],
    vitals:{lcpObserved:false,clsObserved:false}
  });
  assert.equal(result.metricsForAudit.totalBytes,undefined);
  assert.equal(result.metricsForAudit.jsBytes,undefined);
  assert.ok(result.missingForAudit.includes('totalBytes'));
  assert.ok(result.missingForAudit.includes('jsBytes'));
  assert.equal(result.measurementStatus,'PARTIAL_MEASURED');
});

test('browser performance metrics can be unavailable without substituting zero for absent Core Web Vitals', () => {
  const result=normalizeBrowserPerformanceMetrics({});
  assert.equal(result.measurementStatus,'NEEDS_BROWSER_METRICS');
  assert.equal(result.metricsForAudit.lcpMs,undefined);
  assert.equal(result.metricsForAudit.cls,undefined);
  assert.equal(result.metricsForAudit.inpMs,undefined);
});
