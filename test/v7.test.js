import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {PNG} from 'pngjs';
import {assetType,safeAssetName,validateAssetUpload,hashBuffer} from '../src/assets/library.js';
import {comparePng,baselinePath} from '../src/verification/visual.js';
import {Store} from '../src/db/store.js';
import {createDefaultSiteContent,normalizeSiteContent} from '../src/site/content.js';

test('asset library classifies and validates web assets safely',()=>{
  assert.equal(assetType({name:'house.glb',mime:'model/gltf-binary'}),'model');
  assert.equal(assetType({name:'hero.webp',mime:'image/webp'}),'image');
  assert.equal(assetType({name:'tour.mp4',mime:'video/mp4'}),'video');
  assert.equal(safeAssetName('../My House 01.glb'),'My_House_01.glb');
  const body=Buffer.from('asset');assert.equal(hashBuffer(body).length,64);
  assert.equal(validateAssetUpload({name:'house.glb',mime:'application/octet-stream',size:1024}).ok,true);
  assert.equal(validateAssetUpload({name:'script.exe',mime:'application/octet-stream',size:1024}).ok,false);
});

test('visual diff passes identical images and reports changed pixels',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cv-visual-'));const a=path.join(dir,'a.png'),b=path.join(dir,'b.png'),diff=path.join(dir,'diff.png');
  const one=new PNG({width:12,height:12}),two=new PNG({width:12,height:12});
  for(let i=0;i<one.data.length;i+=4){one.data[i]=40;one.data[i+1]=60;one.data[i+2]=80;one.data[i+3]=255;two.data[i]=40;two.data[i+1]=60;two.data[i+2]=80;two.data[i+3]=255;}
  fs.writeFileSync(a,PNG.sync.write(one));fs.writeFileSync(b,PNG.sync.write(two));
  let result=await comparePng(a,b,diff,{visualThreshold:0.001,pixelThreshold:5});assert.equal(result.passed,true);assert.equal(result.changedPixels,0);
  const decoded=PNG.sync.read(fs.readFileSync(b));decoded.data[0]=250;fs.writeFileSync(b,PNG.sync.write(decoded));
  result=await comparePng(a,b,diff,{visualThreshold:0.001,pixelThreshold:5});assert.equal(result.passed,false);assert.ok(result.changedPixels>0);assert.ok(fs.existsSync(diff));
  assert.equal(path.basename(baselinePath(dir,'/')), 'home.png');
});

test('visual baselines persist per project and route',()=>{
  const file=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'cv-store-')),'db.sqlite');const store=new Store(file);
  const user=store.createUser('visual@example.com','hash');const project=store.createProject(user.id,{name:'Visual'});
  const baseline=store.upsertVisualBaseline(project.id,user.id,{route:'/',storedPath:'/tmp/home.png',size:10,sha256:'abc',width:1440,height:900});
  assert.equal(baseline.route,'/');assert.equal(store.listVisualBaselines(project.id,user.id).length,1);assert.equal(store.getVisualBaseline(project.id,user.id,'/').sha256,'abc');
  assert.deepEqual(store.listVisualBaselines(project.id,'someone').length,0);store.close();
});

test('3D-capable content keeps model and video bindings during normalization',()=>{
  const content=normalizeSiteContent({products:[{title:'Chair',model:{assetId:'m1',url:'/assets/m1.glb'},video:{assetId:'v1',url:'/assets/v1.mp4'}}],scenes:[{title:'Hero',model:{assetId:'m2',url:'/assets/m2.glb'},hotspots:[{label:'Living',position:{x:1,y:2,z:3}}]}]},'ecommerce');
  assert.equal(content.products[0].model.assetId,'m1');assert.equal(content.products[0].model.url,'/assets/m1.glb');assert.equal(content.products[0].video.url,'/assets/v1.mp4');assert.equal(content.scenes[0].hotspots.length,1);
});
