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

test('native fallbacks expose executable project contracts',()=>{
  const expoSpec=analyzeRequirements('Build a cross platform mobile app',{targetId:'mobile-expo'});
  const expo=generateTargetFallback(expoSpec,getTarget('mobile-expo'));
  const expoFiles=new Map(expo.files.map(x=>[x.path,x.content]));
  assert.ok(expoFiles.has('tsconfig.json'));
  assert.match(expoFiles.get('package.json'),/"expo":"\\^57\\.0\\.0"/);
  assert.match(expoFiles.get('package.json'),/"check":"tsc --noEmit"/);
  assert.ok(!expoFiles.get('package.json').includes('node --check App.tsx'));

  const tauriSpec=analyzeRequirements('Build a Tauri desktop app',{targetId:'desktop-tauri'});
  const tauri=generateTargetFallback(tauriSpec,getTarget('desktop-tauri'));
  const tauriFiles=new Map(tauri.files.map(x=>[x.path,x.content]));
  for(const required of getTarget('desktop-tauri').requiredFiles)assert.ok(tauriFiles.has(required),required);
  assert.ok(tauriFiles.has('src-tauri/build.rs'));
  assert.ok(tauriFiles.has('test/smoke.test.js'));
  assert.match(tauriFiles.get('src/index.html'),/Tauri|codingVibes|Build Vibe/);
});

test('Android verifier recognizes project-local Gradle wrappers',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'cv-gradle-'));
  fs.writeFileSync(path.join(root,'gradlew'),'#!/bin/sh\nexit 0\n');
  const toolchain=inspectToolchain(getTarget('android-kotlin'),root);
  assert.equal(toolchain.checks.gradle,true);
});

test('target structure verifier reports missing files without running project code',()=>{
  const target=getTarget('mobile-flutter');
  const result=inspectTargetStructure('/tmp/codingvibes-nonexistent',target);
  assert.equal(result.passed,false);
  assert.ok(result.details.missing.length>0);
  assert.ok(inspectToolchain(target).required.includes('flutter'));
});
