import test from 'node:test';
import assert from 'node:assert/strict';
import {searchTemplates} from '../src/templates/catalog.js';

test('template search ranks exact and field matches above loose text matches',()=>{
  const results=searchTemplates('real estate 3d',{limit:20});
  assert.ok(results.length>=2);
  const labels=results.slice(0,4).map(x=>x.label);
  assert.equal(labels[0],'Real Estate 3D Tour');
  assert.ok(['Property Development 3D','Property + AI Video Tour','Real Estate Developer 3D'].includes(labels[1]));
});

test('template search remains deterministic and bounded',()=>{
  const first=searchTemplates('store',{limit:7}).map(x=>x.id);
  const second=searchTemplates('store',{limit:7}).map(x=>x.id);
  assert.deepEqual(first,second);
  assert.equal(first.length<=7,true);
});
