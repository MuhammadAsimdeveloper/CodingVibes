import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeRequirements,completeSpec} from '../src/agent/requirements.js';
import {generateProject} from '../src/agent/project-generator.js';

test('generated websites ship keyboard-visible focus indicators and minimum touch target sizing',()=>{
  const spec=completeSpec(analyzeRequirements('Build a professional business website with a contact form.'));
  const plan=generateProject(spec);
  const stylesheet=plan.files.find(file=>file.path==='public/styles.css')?.content||'';
  assert.match(stylesheet,/:where\(a\[href\],button,input:not\(\[type="hidden"\]\),select,textarea,\[tabindex\]:not\(\[tabindex="-1"\]\)\):focus-visible\{outline:3px solid #a8c5ff/);
  assert.match(stylesheet,/button,\.nav-link,\.primary-link,\.primary-cta,\.cookie-settings-trigger,\.file-button\{min-height:44px\}/);
  assert.match(stylesheet,/input\[type="checkbox"\],input\[type="radio"\]\{width:1\.25rem;height:1\.25rem/);
  assert.match(stylesheet,/@media\(forced-colors:active\)/);
  assert.match(stylesheet,/@media\(prefers-reduced-motion:reduce\)/);
});
