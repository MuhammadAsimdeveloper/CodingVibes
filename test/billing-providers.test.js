import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {getPaddleStatus,verifyPaddleSignature,paddlePlanFromPrice,paddlePlanFromSubscription,createPaddleCustomer,createPaddleCheckoutTransaction,createPaddlePortalSession} from '../src/billing/paddle.js';
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


test('Paddle API helpers create customer, transaction and portal links through the provider contract',async()=>{
  const originalFetch=globalThis.fetch;
  const calls=[];
  try{
    globalThis.fetch=async(url,options={})=>{
      calls.push({url,options});
      if(String(url).endsWith('/customers'))return new Response(JSON.stringify({data:{id:'ctm_test',email:'billing@example.com'}}),{status:201,headers:{'content-type':'application/json'}});
      if(String(url).endsWith('/transactions'))return new Response(JSON.stringify({data:{id:'txn_test',status:'ready',customer_id:'ctm_test',subscription_id:null,checkout:{url:'https://pay.example.test/?_ptxn=txn_test'}}}),{status:201,headers:{'content-type':'application/json'}});
      if(String(url).includes('/portal-sessions'))return new Response(JSON.stringify({data:{id:'cpls_test',urls:{general:{overview:'https://portal.example.test/overview'},subscriptions:[{id:'sub_test',view_subscription:'https://portal.example.test/subscription'}]}}}),{status:201,headers:{'content-type':'application/json'}});
      return new Response('{}',{status:404});
    };
    const env={PADDLE_API_KEY:'api-key',PADDLE_WEBHOOK_SECRET:'secret',PADDLE_CHECKOUT_URL:'https://app.example.test/pay',PADDLE_PRICE_PRO_MONTHLY:'pri_pro',PADDLE_PRICE_TEAM_MONTHLY:'pri_team'};
    const customer=await createPaddleCustomer({email:'Billing@Example.com',userId:'user-1',env});
    assert.equal(customer.id,'ctm_test');
    const tx=await createPaddleCheckoutTransaction({priceId:'pri_pro',email:'billing@example.com',userId:'user-1',plan:'pro',successUrl:'https://app.example.test/?billing=success',cancelUrl:'https://app.example.test/?billing=cancel',customerId:customer.id,env});
    assert.equal(tx.id,'txn_test');
    assert.equal(tx.url,'https://pay.example.test/?_ptxn=txn_test');
    const portal=await createPaddlePortalSession({customerId:'ctm_test',subscriptionId:'sub_test',env});
    assert.equal(portal.url,'https://portal.example.test/overview');
    assert.equal(portal.subscriptionUrl,'https://portal.example.test/subscription');
    assert.equal(paddlePlanFromSubscription({items:[{price:{id:'pri_team'}}] },env),'team');
    assert.equal(calls.length,3);
    assert.match(String(calls[1].options.body),/pri_pro/);
  }finally{globalThis.fetch=originalFetch;}
});


test('Paddle request layer fails closed for missing configuration, provider errors and timeouts',async()=>{
  await assert.rejects(
    createPaddleCustomer({email:'x@example.com',userId:'u',env:{}}),
    /paddle_billing_not_configured/
  );
  await assert.rejects(
    createPaddleCheckoutTransaction({priceId:'',env:{PADDLE_API_KEY:'k'}}),
    /paddle_price_not_configured/
  );
  await assert.rejects(
    createPaddlePortalSession({customerId:'',env:{PADDLE_API_KEY:'k'}}),
    /paddle_customer_missing/
  );
  const originalFetch=globalThis.fetch;
  try{
    globalThis.fetch=async()=>new Response(JSON.stringify({error:{detail:'bad request'}}),{status:400});
    await assert.rejects(
      createPaddleCustomer({email:'x@example.com',userId:'u',env:{PADDLE_API_KEY:'k'}}),
      /bad request/
    );
    globalThis.fetch=async()=>{throw new DOMException('aborted','AbortError');};
    await assert.rejects(
      createPaddleCustomer({email:'x@example.com',userId:'u',env:{PADDLE_API_KEY:'k'}}),
      /paddle_request_timeout/
    );
    globalThis.fetch=async()=>new Response('not-json',{status:200});
    const portal=await createPaddlePortalSession({customerId:'ctm',env:{PADDLE_API_KEY:'k'}});
    assert.equal(portal.url,null);
  }finally{globalThis.fetch=originalFetch;}
});

test('Paddle subscription mapping tolerates custom data and unrecognized prices',()=>{
  const env={PADDLE_PRICE_PRO_MONTHLY:'pri_pro',PADDLE_PRICE_TEAM_MONTHLY:'pri_team'};
  assert.equal(paddlePlanFromSubscription({items:[{price:{id:'unknown'}}],custom_data:{plan:'pro'}},env),'pro');
  assert.equal(paddlePlanFromSubscription({items:[{price_id:'pri_team'}]},env),'team');
  assert.equal(paddlePlanFromSubscription({items:[],custom_data:{plan:'free'}},env),null);
});
