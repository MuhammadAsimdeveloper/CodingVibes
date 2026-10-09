import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {generateProject} from '../src/agent/project-generator.js';
import {analyzeRequirements} from '../src/agent/requirements.js';

test('generated products include dependency-free visual selection runtime',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'cv-visual-edit-'));
  const spec=analyzeRequirements('Build a business website with contact form');
  const plan=generateProject(spec);
  const visual=plan.files.find(x=>x.path==='public/visual-edit.js');
  assert.ok(visual);
  assert.match(visual.content,/buildvibe:visual-select/);
  assert.match(plan.files.find(x=>x.path==='public/index.html').content,/visual-edit\.js/);
  fs.rmSync(root,{recursive:true,force:true});
});


test('visual editing runtime is opt-in, origin-checked, and limits style mutations',()=>{
  const spec=analyzeRequirements('Build a business website with contact form');
  const plan=generateProject(spec);
  const visual=plan.files.find(x=>x.path==='public/visual-edit.js');
  assert.ok(visual);
  assert.match(visual.content,/designMode/);
  assert.match(visual.content,/event\.source!==window\.parent/);
  assert.match(visual.content,/event\.origin!==window\.location\.origin/);
  assert.match(visual.content,/STYLE_KEYS\.has\(key\)/);
  assert.match(visual.content,/javascript/);
  const generatedPackage=JSON.parse(plan.files.find(x=>x.path==='package.json').content);
  assert.match(generatedPackage.scripts.check,/public\/visual-edit\.js/);
});
