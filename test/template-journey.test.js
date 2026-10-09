import test from 'node:test';
import assert from 'node:assert/strict';
import {templateGenres} from '../src/templates/genres.js';

test('template library exposes separate website/app genre families',()=>{
 const groups=templateGenres();
 assert.ok(groups.some(x=>x.id==='web-3d'));
 assert.ok(groups.some(x=>x.id==='web-landing'));
 assert.ok(groups.some(x=>x.id==='web-portfolio'));
 assert.ok(groups.some(x=>x.id==='web-app'));
 assert.ok(groups.some(x=>x.id==='android-apk'));
});
