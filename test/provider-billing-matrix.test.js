import test from 'node:test';import assert from 'node:assert/strict';import {planCatalog} from '../src/billing/plans.js';
test('plan catalog contains public-facing free/pro/team/business/enterprise positioning',()=>{
 const ids=planCatalog({}).map(x=>x.id);for(const id of ['free','pro','team','business','enterprise'])assert.ok(ids.includes(id),id);
});
