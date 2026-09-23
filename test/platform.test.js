import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeRequirements} from '../src/agent/requirements.js';
import {normalizeSpec,validateSpec} from '../src/agent/app-spec.js';
import {generateProject} from '../src/agent/project-generator.js';

test('requirements create a valid structured contract',()=>{const s=analyzeRequirements('Build a booking platform with customer accounts, appointments and an admin dashboard');assert.equal(validateSpec(normalizeSpec(s)).ok,true);assert.ok(s.pages.includes('/admin'));assert.ok(s.dataModel.some(x=>x.name==='appointments'));});
test('generator emits a runnable application',()=>{const plan=generateProject(analyzeRequirements('Create an ecommerce store with login, products, checkout and an admin dashboard'));const paths=plan.files.map(x=>x.path);assert.ok(paths.includes('app/server.js'));assert.ok(paths.includes('package.json'));assert.ok(paths.includes('test/acceptance.test.js'));assert.ok(plan.files.every(x=>!x.path.includes('..')));});
