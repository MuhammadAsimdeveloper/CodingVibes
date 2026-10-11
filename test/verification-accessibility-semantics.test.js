import test from 'node:test';
import assert from 'node:assert/strict';
import {assessAccessibilitySemantics,assessBrowserQuality,assessTextContrast} from '../src/verification/playwright.js';

test('text contrast audit enforces WCAG-style 4.5:1 and large-text 3:1 ratios',()=>{
  const pass=assessTextContrast([
    {text:'Body text',ratio:7.1,minimum:4.5},
    {text:'Large heading',ratio:3.2,minimum:3}
  ]);
  assert.equal(pass.ok,true);
  assert.equal(pass.checkedCount,2);
  assert.equal(pass.failures.length,0);

  const fail=assessTextContrast([
    {text:'Low contrast body',ratio:3.8,minimum:4.5},
    {text:'Low contrast heading',ratio:2.2,minimum:3}
  ]);
  assert.equal(fail.ok,false);
  assert.equal(fail.failures.length,2);
  assert.match(fail.failures.join(' '),/3.8:1 is below 4.5:1/);
  assert.match(fail.failures.join(' '),/2.2:1 is below 3:1/);
});

test('contrast audit reports complex image backgrounds as skipped rather than claiming a pass',()=>{
  const result=assessTextContrast([
    {text:'Photo overlay text',minimum:4.5,skippedReason:'complex_background_or_color'},
    {text:'Unknown contrast',ratio:NaN,minimum:4.5}
  ]);
  assert.equal(result.ok,true);
  assert.equal(result.checkedCount,0);
  assert.equal(result.skippedCount,2);
  assert.equal(result.skipped[0].reason,'complex_background_or_color');
});

test('accessibility semantics accept decorative empty-alt images and a coherent heading/form structure',()=>{
  const result=assessAccessibilitySemantics({
    imagesMissingAlt:0,
    controlsWithoutName:0,
    linksWithoutName:0,
    formControlsWithoutName:0,
    interactiveAriaHidden:0,
    smallTouchTargets:[],
    headingLevels:[1,2,3,2]
  });
  assert.equal(result.ok,true);
  assert.deepEqual(result.failures,[]);
  assert.equal(result.h1Count,1);
});

test('accessibility semantics report missing image alternatives, unnamed fields and broken heading hierarchy',()=>{
  const result=assessAccessibilitySemantics({
    imagesMissingAlt:1,
    controlsWithoutName:1,
    linksWithoutName:1,
    formControlsWithoutName:2,
    interactiveAriaHidden:1,
    smallTouchTargets:[{tag:'button',width:22,height:20}],
    headingLevels:[2,2,3]
  });
  assert.equal(result.ok,false);
  assert.match(result.failures.join(' '),/image\(s\) missing an alt attribute/);
  assert.match(result.failures.join(' '),/control\(s\) without accessible name/);
  assert.match(result.failures.join(' '),/link\(s\) without accessible name/);
  assert.match(result.failures.join(' '),/form field\(s\) without accessible name/);
  assert.match(result.failures.join(' '),/interactive element\(s\) incorrectly aria-hidden/);
  assert.match(result.failures.join(' '),/primary interactive target\(s\) are below minimum target dimensions/);
  assert.match(result.failures.join(' '),/expected one H1/);
});

test('browser quality gate requires a visible keyboard focus indicator',()=>{
  const result={
    status:200,
    consoleErrors:[],
    requestFailures:[],
    responseFailures:[],
    uiFailures:[],
    performance:{navigationDurationMs:0,transferBytes:0},
    accessibility:{keyboard:{focusableCount:3,firstTabFocused:true,focusIndicatorVisible:true}}
  };
  assert.equal(assessBrowserQuality(result).ok,true);
  result.accessibility.keyboard.focusIndicatorVisible=false;
  const failed=assessBrowserQuality(result);
  assert.equal(failed.ok,false);
  assert.match(failed.failures.join(' '),/keyboard focus indicator is not visibly styled/);
});

test('accessibility semantics reject heading-level skips and pages without a primary heading',()=>{
  assert.match(assessAccessibilitySemantics({headingLevels:[1,3]}).failures.join(' '),/skips from H1 to H3/);
  assert.match(assessAccessibilitySemantics({headingLevels:[2,2,3]}).failures.join(' '),/expected one H1/);
});
