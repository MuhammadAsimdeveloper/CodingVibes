import test from 'node:test';
import assert from 'node:assert/strict';
import {generateProject} from '../src/agent/project-generator.js';
import {analyzeRequirements} from '../src/agent/requirements.js';

test('generated products include an opt-in, dependency-free visual selection runtime', () => {
  const spec = analyzeRequirements('Build a business website with contact form');
  const plan = generateProject(spec);
  const visual = plan.files.find(file => file.path === 'public/visual-edit.js');
  assert.ok(visual);
  assert.match(visual.content, /buildvibe:visual-select/);
  assert.match(visual.content, /buildvibe:visual-edit-toggle/);
  assert.match(visual.content, /event\.source !== window\.parent/);
  assert.match(visual.content, /data-buildvibe-select-enabled/);
  assert.match(plan.files.find(file => file.path === 'public/index.html').content, /visual-edit\.js/);
  assert.match(plan.files.find(file => file.path === 'public/contact.html').content, /visual-edit\.js/);
  const generatedPackage = JSON.parse(plan.files.find(file => file.path === 'package.json').content);
  assert.match(generatedPackage.scripts.check, /public\/visual-edit\.js/);
});
