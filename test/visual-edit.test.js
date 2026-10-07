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
