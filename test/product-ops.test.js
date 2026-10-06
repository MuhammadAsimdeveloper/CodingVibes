import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {Store} from '../src/db/store.js';
import {sanitizeProductEvent,recordProductEvent} from '../src/ops/product-analytics.js';
import {normalizeFeatureFlag,evaluateFeatureFlag} from '../src/ops/feature-flags.js';

function tempStore(){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'build-vibe-product-'));
  return{dir,store:new Store(path.join(dir,'db.sqlite'))};
}

test('product analytics sanitizes secrets, bounds properties and persists events',()=>{
  const {dir,store}=tempStore();
  try{
    const user=store.createUser('analytics@example.com','hash');
    const project=store.createProject(user.id,{name:'Analytics Project'});
    const event=sanitizeProductEvent({
      userId:user.id,projectId:project.id,event:'builder.build.completed',
      properties:{prompt:'Build a dashboard',apiKey:'secret',password:'pw',token:'tok',nested:{a:1},count:7}
    });
    assert.equal(event.event,'builder.build.completed');
    assert.equal(event.properties.prompt,'Build a dashboard');
    assert.equal('apiKey' in event.properties,false);
    assert.equal('password' in event.properties,false);
    assert.equal('token' in event.properties,false);
    assert.equal(event.properties.nested,'[object Object]');
    const saved=recordProductEvent(store,event);
    assert.equal(saved.event,'builder.build.completed');
    assert.equal(store.listProductEvents({userId:user.id}).length,1);
  }finally{store.close();fs.rmSync(dir,{recursive:true,force:true});}
});

test('product analytics rejects unsafe event names',()=>{
  assert.throws(()=>sanitizeProductEvent({event:'../../secrets',properties:{}}),/invalid_event_name/);
});

test('feature flag evaluation is deterministic and kill switches fail closed',()=>{
  const flag=normalizeFeatureFlag({
    key:'new-studio',
    enabled:true,
    rolloutPercentage:25,
    environments:['production','staging'],
    killSwitch:false,
    config:{layout:'v2'}
  });
  const a=evaluateFeatureFlag(flag,{userId:'u-123',environment:'production'});
  const b=evaluateFeatureFlag(flag,{userId:'u-123',environment:'production'});
  assert.equal(a.enabled,b.enabled);
  assert.equal(a.reason,b.reason);
  assert.equal(evaluateFeatureFlag(flag,{userId:'u-123',environment:'development'}).enabled,false);
  assert.equal(evaluateFeatureFlag({...flag,killSwitch:true},{userId:'u-123',environment:'production'}).enabled,false);
  assert.deepEqual(normalizeFeatureFlag({...flag,rolloutPercentage:100}).rolloutPercentage,100);
});

test('project memory keeps bounded durable decisions and never stores secret-like keys',()=>{
  const {dir,store}=tempStore();
  try{
    const user=store.createUser('memory@example.com','hash');
    const project=store.createProject(user.id,{name:'Memory Project'});
    store.setProjectMemory(project.id,user.id,{decisions:[{topic:'stack',value:'Next.js'}],notes:['Use structured content'],apiKey:'never'});
    const memory=store.getProjectMemory(project.id,user.id);
    assert.equal(memory.decisions[0].value,'Next.js');
    assert.equal('apiKey' in memory,false);
    const next=store.appendProjectMemory(project.id,user.id,'decisions',{topic:'deployment',value:'Vercel'});
    assert.equal(next.decisions.length,2);
    assert.equal(store.getProjectMemory(project.id,user.id).decisions.length,2);
  }finally{store.close();fs.rmSync(dir,{recursive:true,force:true});}
});

test('feature flags persist with normalized rollout and metadata',()=>{
  const {dir,store}=tempStore();
  try{
    const user=store.createUser('flags@example.com','hash');
    const saved=store.upsertFeatureFlag(user.id,{key:'browser-qa-v2',enabled:true,rolloutPercentage:50,environments:['production'],config:{threshold:0.2}});
    assert.equal(saved.key,'browser-qa-v2');
    assert.equal(saved.rollout_percentage,50);
    assert.deepEqual(saved.config,{threshold:0.2});
    assert.equal(store.getFeatureFlag('browser-qa-v2').key,'browser-qa-v2');
    assert.equal(store.listFeatureFlags().length,1);
  }finally{store.close();fs.rmSync(dir,{recursive:true,force:true});}
});
