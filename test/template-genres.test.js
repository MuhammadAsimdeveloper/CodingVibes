import test from 'node:test';
import assert from 'node:assert/strict';
import {listTemplateGenres, templateGenreFor} from '../src/templates/catalog.js';

test('template catalog exposes clean genre taxonomy for studio discovery',()=>{
  const genres=listTemplateGenres();
  for(const expected of ['landing','web-app','mobile-app','apk','3d','animated','portfolio','ecommerce','real-estate']) {
    assert.ok(genres.some(x=>x.id===expected),expected);
  }
});

test('known 3D template resolves to 3D and genre facets',()=>{
  const item=templateGenreFor({kind:'ecommerce',experience:'3d',tags:['product','3d']});
  assert.ok(item.includes('3d'));
  assert.ok(item.includes('ecommerce'));
});
