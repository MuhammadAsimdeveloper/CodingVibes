import test from 'node:test';
import assert from 'node:assert/strict';
import {auditImmersiveSource} from '../src/verification/immersive.js';

test('immersive audit requires core 360 controls, model loading, fallback and media for a rich 3D experience',()=>{
  const source='GLTFLoader OrbitControls canvas fallback loading error video hotspots cameraPath prefers-reduced-motion';
  const result=auditImmersiveSource(source,{threeD:true,immersiveMedia:true,hotspots:true,cameraPath:true});
  assert.equal(result.releaseReady,true); assert.equal(result.missing.length,0);
});
test('immersive audit reports missing interaction controls',()=>{
  const result=auditImmersiveSource('<canvas>model</canvas>',{threeD:true,immersiveMedia:true});
  assert.ok(result.missing.includes('360/orbit controls')); assert.equal(result.releaseReady,false);
});