import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {analyzeRequirements} from '../src/agent/requirements.js';
import {generateProject,materializeProject} from '../src/agent/project-generator.js';

test('generated app passes its own checks and tests',()=>{const root=fs.mkdtempSync(path.join(os.tmpdir(),'cv-gen-'));const plan=generateProject(analyzeRequirements('Build a small dashboard with login and search'));materializeProject(plan,root);execFileSync(process.execPath,['--check','app/server.js'],{cwd:root,stdio:'pipe'});execFileSync('npm',['test'],{cwd:root,stdio:'pipe'});execFileSync('npm',['run','check'],{cwd:root,stdio:'pipe'});assert.ok(fs.existsSync(path.join(root,'codingvibes.app.json')));});
