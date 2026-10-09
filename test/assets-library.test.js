import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assetRoleAllowed, assetType, hashBuffer, normalizeAssetMetadata, safeAssetName,
  validateAssetContent, validateAssetUpload
} from '../src/assets/library.js';

test('asset type validation binds extension, MIME, role and size',()=>{
  assert.deepEqual(validateAssetUpload({name:'hero.png',mime:'image/png',size:64,role:'scene-poster'}).ok,true);
  assert.equal(validateAssetUpload({name:'hero.png',mime:'text/html',size:64}).error,'asset_mime_mismatch');
  assert.equal(validateAssetUpload({name:'payload.html',mime:'text/html',size:64}).error,'unsupported_asset_type');
  assert.equal(validateAssetUpload({name:'video.mp4',mime:'video/mp4',size:64,role:'scene-model'}).error,'asset_role_type_mismatch');
  assert.equal(validateAssetUpload({name:'hero.png',mime:'image/png',size:64,role:'admin'}).error,'asset_role_invalid');
  assert.equal(validateAssetUpload({name:'hero.png',mime:'image/png',size:0}).error,'asset_size_required');
  assert.equal(validateAssetUpload({name:'hero.png',mime:'image/png',size:101}).ok,true);
  assert.equal(assetRoleAllowed('scene-model'),true);
  assert.equal(assetType({name:'hero.glb',mime:'application/octet-stream'}),'model');
});

test('content inspection rejects renamed executable content and malformed model manifests',()=>{
  assert.equal(validateAssetContent({name:'fake.png',mime:'image/png',body:Buffer.from('<html>no</html>')}).error,'asset_content_mismatch');
  assert.equal(validateAssetContent({name:'model.gltf',mime:'model/gltf+json',body:Buffer.from(JSON.stringify({asset:{version:'2.0'},buffers:[{uri:'../secret.bin'}]}))}).error,'asset_content_mismatch');
  assert.equal(validateAssetContent({name:'model.glb',mime:'model/gltf-binary',body:Buffer.from('not a glb')}).error,'asset_content_mismatch');
});

test('SVG uploads permit static vectors and reject active or externally loaded content',()=>{
  const safe=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>');
  assert.equal(validateAssetContent({name:'logo.svg',mime:'image/svg+xml',body:safe}).ok,true);
  for(const value of [
    '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><image href="https://evil.example/x"/></svg>',
    '<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]><svg>&x;</svg>'
  ]){
    assert.equal(validateAssetContent({name:'logo.svg',mime:'image/svg+xml',body:Buffer.from(value)}).ok,false);
  }
});

test('asset metadata is bounded and only contains JSON scalar values',()=>{
  assert.deepEqual(normalizeAssetMetadata({alt:'Hero',priority:2,decorative:false}),{ok:true,value:{alt:'Hero',priority:2,decorative:false}});
  assert.equal(normalizeAssetMetadata([]).error,'asset_metadata_must_be_object');
  assert.equal(normalizeAssetMetadata({nested:{key:'value'}}).error,'asset_metadata_values_must_be_scalars');
  assert.equal(normalizeAssetMetadata({storage:{key:'attacker-controlled'}}).error,'asset_metadata_invalid_key');
  assert.equal(safeAssetName('../../My logo?.png'),'My_logo_.png');
  assert.equal(hashBuffer(Buffer.from('asset')).length,64);
});
