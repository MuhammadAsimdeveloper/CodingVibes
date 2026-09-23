import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {Store} from '../src/db/store.js';
import {planCatalog,canStartRun} from '../src/billing/plans.js';
import {verifyStripeSignature} from '../src/billing/stripe.js';
import {readiness} from '../src/ops/readiness.js';

test('billing defaults to free and exposes configured plan catalog',()=>{
 const dir=mkdtempSync(path.join(os.tmpdir(),'cv-billing-'));const db=path.join(dir,'x.db');const store=new Store(db);const u=store.createUser('billing@example.com','hash');const b=store.getBilling(u.id);assert.equal(b.plan,'free');assert.ok(planCatalog({STRIPE_PRICE_PRO_MONTHLY:'price_x'}).find(x=>x.id==='pro').stripePriceConfigured);const usage=store.monthlyUsage(u.id,'2999-01');assert.deepEqual(usage,{period:'2999-01',runs:0,tokens:0});assert.equal(canStartRun({plan:'free',runs:0,tokens:0}).ok,true);store.close();
});

test('stripe signatures verify with timestamped payloads',async()=>{
 const raw='{"id":"evt_test"}',secret='whsec_test';const ts=Math.floor(Date.now()/1000);const crypto=await import('node:crypto');const sig=crypto.createHmac('sha256',secret).update(`${ts}.${raw}`).digest('hex');assert.equal(verifyStripeSignature(raw,`t=${ts},v1=${sig}`,secret),true);assert.equal(verifyStripeSignature(raw,`t=${ts-9999},v1=${sig}`,secret),false);
});

test('readiness reports production blockers without secrets',()=>{
 const previous={...process.env};try{process.env.NODE_ENV='production';delete process.env.CODINGVIBES_SESSION_SECRET;delete process.env.DAYTONA_API_KEY;delete process.env.CODINGVIBES_ENFORCE_QUOTAS;const r=readiness({router:{getStatus:()=>({configured:false,provider:'openai'})}});assert.equal(r.ready,false);assert.ok(r.blockers.includes('session_secret_too_short'));assert.ok(r.blockers.includes('daytona_api_key_missing'));assert.ok(r.blockers.includes('quota_enforcement_not_enabled'));}finally{for(const k of Object.keys(process.env))if(!(k in previous))delete process.env[k];for(const [k,v] of Object.entries(previous))process.env[k]=v;}
});
