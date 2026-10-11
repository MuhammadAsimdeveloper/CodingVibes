import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {PNG} from 'pngjs';
import {createOptimizedExportWorkspace} from '../src/deployment/media-optimizer.js';

function makePng(width,height){
  const image=new PNG({width,height});
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=(y*width+x)*4;
    image.data[i]=(x*17+y*3)%256;
    image.data[i+1]=(x*7+y*19)%256;
    image.data[i+2]=(x*13+y*11)%256;
    image.data[i+3]=255;
  }
  return PNG.sync.write(image,{compressionLevel:1});
}

test('export raster optimization resizes oversized PNGs in an isolated copy and preserves paths',async()=>{
  const sourceRoot=fs.mkdtempSync(path.join(os.tmpdir(),'build-vibe-raster-source-'));
  try{
    fs.mkdirSync(path.join(sourceRoot,'public'),{recursive:true});
    const originalPng=makePng(640,320);
    fs.writeFileSync(path.join(sourceRoot,'public','hero.png'),originalPng);
    fs.writeFileSync(path.join(sourceRoot,'public','hero.jpg'),Buffer.from('not-a-jpeg; safe fallback'));
    fs.writeFileSync(path.join(sourceRoot,'index.html'),Buffer.from('<img src="/public/hero.png" alt="Hero">'));
    const artifact={root:sourceRoot,files:[
      {path:'public/hero.png',size:originalPng.length},
      {path:'public/hero.jpg',size:25},
      {path:'index.html',size:39}
    ]};
    const workspace=await createOptimizedExportWorkspace(artifact,{maxDimension:256});
    try{
      assert.equal(workspace.report.schema,'build-vibe.raster-optimization.v1');
      assert.equal(workspace.report.optimized,1);
      assert.ok(workspace.report.savedBytes>0);
      assert.ok(workspace.files.find(x=>x.path==='public/hero.png').size<originalPng.length);
      const optimized=PNG.sync.read(fs.readFileSync(path.join(workspace.root,'public','hero.png')));
      assert.equal(optimized.width,256);
      assert.equal(optimized.height,128);
      assert.deepEqual(fs.readFileSync(path.join(sourceRoot,'public','hero.png')),originalPng,'source assets must never be mutated');
      assert.equal(fs.readFileSync(path.join(workspace.root,'public','hero.jpg'),'utf8'),'not-a-jpeg; safe fallback');
      assert.equal(fs.readFileSync(path.join(workspace.root,'index.html'),'utf8'),'<img src="/public/hero.png" alt="Hero">');
      assert.equal(workspace.report.assets[0].path,'public/hero.png');
    }finally{workspace.cleanup();}
  }finally{fs.rmSync(sourceRoot,{recursive:true,force:true});}
});

test('export optimizer validates settings and rejects paths escaping the artifact root',async()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'build-vibe-raster-guard-'));
  try{
    await assert.rejects(createOptimizedExportWorkspace({root,files:[]},{maxDimension:12}),/maxDimension/);
    await assert.rejects(createOptimizedExportWorkspace({root,files:[{path:'../outside',size:0}]}),/invalid_export_asset_path/);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
