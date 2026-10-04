import test from 'node:test';
import assert from 'node:assert/strict';
import {submitIndexNow} from '../src/seo/indexnow.js';

test('IndexNow safely skips when no key is configured',async()=>{
  const result=await submitIndexNow({urls:['https://example.com/']});
  assert.deepEqual(result,{ok:false,skipped:true,reason:'indexnow_key_not_configured'});
});

test('IndexNow rejects URLs from multiple hosts before sending',async()=>{
  await assert.rejects(()=>submitIndexNow({urls:['https://example.com/','https://other.example/'],key:'demo-key'}),/indexnow_urls_must_share_one_host/);
});
