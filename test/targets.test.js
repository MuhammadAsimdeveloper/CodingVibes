import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeRequirements} from '../src/agent/requirements.js';
import {validateSpec} from '../src/agent/app-spec.js';
import {listTargets,getTarget,inferTarget} from '../src/targets/registry.js';
import {generateTargetFallback} from '../src/targets/generator.js';
import {inspectTargetStructure,inspectToolchain} from '../src/targets/verify.js';

test('target registry covers web, installable web, mobile, native, desktop and multiplatform families',()=>{
  const ids=listTargets().map(x=>x.id);
  for(const id of ['web-node','web-pwa','android-twa','mobile-expo','mobile-flutter','android-kotlin','ios-swiftui','desktop-electron','desktop-tauri','multiplatform-kmp'])assert.ok(ids.includes(id),id);
});

test('prompt target detection is explicit and deterministic',()=>{
  assert.equal(inferTarget('make an Android APK using native Kotlin').id,'android-kotlin');
  assert.equal(inferTarget('make an installable offline PWA').id,'web-pwa');
  assert.equal(inferTarget('make an iOS SwiftUI app').id,'ios-swiftui');
  assert.equal(inferTarget('make a Flutter app').id,'mobile-flutter');
  assert.equal(inferTarget('make a desktop Tauri app').id,'desktop-tauri');
});

test('every target has a valid contract and deterministic fallback shape',()=>{
  for(const target of listTargets()){
    const spec=analyzeRequirements(`Build a ${target.label} for appointment booking`,{targetId:target.id});
    assert.equal(spec.target.id,target.id);
    assert.equal(validateSpec(spec).ok,true);
    const plan=generateTargetFallback(spec,getTarget(target.id));
    if(plan){const paths=new Set(plan.files.map(x=>x.path));for(const required of getTarget(target.id).requiredFiles)assert.ok(paths.has(required),`${target.id} missing ${required}`);}
  }
});

test('target structure verifier reports missing files without running project code',()=>{
  const target=getTarget('mobile-flutter');
  const result=inspectTargetStructure('/tmp/codingvibes-nonexistent',target);
  assert.equal(result.passed,false);
  assert.ok(result.details.missing.length>0);
  assert.ok(inspectToolchain(target).required.includes('flutter'));
});
