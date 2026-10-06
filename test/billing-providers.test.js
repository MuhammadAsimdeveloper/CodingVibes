import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {getPaddleStatus,verifyPaddleSignature,paddlePlanFromPrice} from '../src/billing/paddle.js';
import {planCatalog} from '../src/billing/plans.js';
import {Store} from '../src/db/store.js';

test('Paddle configuration reports explicit readiness',()=>{
  const configured=getPaddleStatus({PADDLE_API_KEY:'key',PADDLE_WEBHOOK_SECRET:'secret',PADDLE_PRICE_PRO_MONTHLY:'pri_pro',PADDLE_PRICE_TEAM_MONTHLY:'pri_team'});
  assert.equal(configured.status,'CONFIGURED');
  assert.equal(configured.available,true);
  assert.equal(paddlePlanFromPrice('pri_pro',{PADDLE_PRICE_PRO_MONTHLY:'pri_pro',PADDLE_PRICE_TEAM_MONTHLY:'pri_team'}),'pro');
  assert.equal(paddlePlanFromPrice('pri_team',{PADDLE_PRICE_PRO_MONTHLY:'pri_pro',PADDLE_PRICE_TEAM_MONTHLY:'pri_team'}),'team');
});

test('Paddle webhook verification uses raw-body HMAC and rejects replay/invalid signatures',()=>{
  const raw='{"event_id":"evt_test","event_type":"transaction.completed"}';
  const ts=Math.floor(Date.now()/1000);
  const secret='test-secret';
  const h1=crypto.createHmac('sha256',secret).update(`${ts}:${raw}`).digest('hex');
  assert.equal(verifyPaddleSignature(raw,`ts=${ts};h1=${h1}`,secret),true);
  assert.equal(verifyPaddleSignature(raw,`ts=${ts};h1=bad`,secret),false);
  assert.equal(verifyPaddleSignature(raw,`ts=${ts-60};h1=${h1}`,secret),false);
});

test('billing plan catalog exposes provider pricing and team-only features',()=>{
  const catalog=planCatalog({PADDLE_PRICE_PRO_MONTHLY:'pri_pro',PADDLE_PRICE_TEAM_MONTHLY:'pri_team'});
  const pro=catalog.find(x=>x.id==='pro'),team=catalog.find(x=>x.id==='team');
  assert.equal(pro.paddlePriceConfigured,true);
  assert.equal(team.paddlePriceConfigured,true);
  assert.ok(team.features.includes('team_collaboration'));
  assert.ok((team.featureCatalog||[]).some(x=>x.id==='scaleout'));
});

test('billing store migrates provider fields without exposing secrets',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'build-vibe-billing-'));
  const db=path.join(dir,'test.db');
  const store=new Store(db);
  const user=store.createUser('billing@example.com','$hash');
  store.updateBilling(user.id,{billing_provider:'paddle',provider_customer_id:'ctm_test',provider_subscription_id:'sub_test',provider_transaction_id:'txn_test',plan:'pro',status:'active'});
  const billing=store.getBilling(user.id);
  assert.equal(billing.billing_provider,'paddle');
  assert.equal(billing.provider_customer_id,'ctm_test');
  assert.equal(store.getBillingByProviderCustomer('paddle','ctm_test').user_id,user.id);
  assert.equal(store.getBillingByProviderSubscription('paddle','sub_test').user_id,user.id);
  store.close();
  fs.rmSync(dir,{recursive:true,force:true});
});
