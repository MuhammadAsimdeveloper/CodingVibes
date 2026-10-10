import test from 'node:test';
import assert from 'node:assert/strict';
import {assessResponsiveLayout} from '../src/verification/playwright.js';

test('responsive layout passes when document and body fit the viewport',()=>{
  const result=assessResponsiveLayout({viewportWidth:375,documentWidth:375,bodyWidth:373,overflowingElements:[]});
  assert.equal(result.ok,true);
  assert.equal(result.horizontalOverflowPx,0);
  assert.deepEqual(result.failures,[]);
});

test('responsive layout fails and reports measured horizontal overflow',()=>{
  const result=assessResponsiveLayout({viewportWidth:375,documentWidth:428,bodyWidth:428,overflowingElements:['.hero-title']});
  assert.equal(result.ok,false);
  assert.equal(result.horizontalOverflowPx,53);
  assert.match(result.failures.join(' '),/horizontal overflow/i);
  assert.deepEqual(result.overflowingElements,['.hero-title']);
});

test('responsive layout tolerates at most two pixels of rounding overflow',()=>{
  assert.equal(assessResponsiveLayout({viewportWidth:375,documentWidth:377,bodyWidth:375}).ok,true);
  assert.equal(assessResponsiveLayout({viewportWidth:375,documentWidth:378,bodyWidth:375}).ok,false);
});

test('responsive layout rejects missing or invalid measurements instead of claiming pass',()=>{
  const result=assessResponsiveLayout({viewportWidth:0,documentWidth:0,bodyWidth:0});
  assert.equal(result.ok,false);
  assert.match(result.failures.join(' '),/valid viewport measurements/i);
});
