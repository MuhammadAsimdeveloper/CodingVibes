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

function makeTransparentEdgePng(width,height){
  const image=new PNG({width,height});
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=(y*width+x)*4;
    if(x<width/2){
      image.data[i]=(x*37+y*19)%256;
      image.data[i+1]=0;
      image.data[i+2]=(x*29+y*7)%256;
      image.data[i+3]=255;
    }else{
      image.data[i]=0;image.data[i+1]=255;image.data[i+2]=0;image.data[i+3]=0;
    }
  }
  return PNG.sync.write(image,{compressionLevel:1});
}

test('PNG resizing premultiplies alpha to avoid transparent RGB halos',async()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'build-vibe-raster-alpha-'));
  try{
    const original=makeTransparentEdgePng(1024,512);
    fs.writeFileSync(path.join(root,'transparent-edge.png'),original);
    const workspace=await createOptimizedExportWorkspace({root,files:[{path:'transparent-edge.png',size:original.length}]},{maxDimension:256});
    try{
      assert.equal(workspace.report.optimized,1);
      const image=PNG.sync.read(fs.readFileSync(path.join(workspace.root,'transparent-edge.png')));
      assert.equal(image.width,256);
      assert.equal(image.height,128);
      for(let i=0;i<image.data.length;i+=4){
        if(image.data[i+3]>0)assert.equal(image.data[i+1],0,'fully transparent green pixels must not tint partially opaque output pixels');
      }
      assert.deepEqual(fs.readFileSync(path.join(root,'transparent-edge.png')),original,'resizing must not mutate source pixels');
    }finally{workspace.cleanup();}
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('export raster optimization resizes oversized PNGs in an isolated copy and preserves paths',async()=>{
  const sourceRoot=fs.mkdtempSync(path.join(os.tmpdir(),'build-vibe-raster-source-'));
  try{
    fs.mkdirSync(path.join(sourceRoot,'public'),{recursive:true});
    const originalPng=makePng(640,320);
    fs.writeFileSync(path.join(sourceRoot,'public','hero.png'),originalPng);
    fs.writeFileSync(path.join(sourceRoot,'public','hero.jpg'),Buffer.from('not-a-jpeg; safe fallback'));
    const oversizedHeader=Buffer.alloc(24);Buffer.from([137,80,78,71,13,10,26,10]).copy(oversizedHeader);oversizedHeader.writeUInt32BE(13,8);oversizedHeader.write('IHDR',12,'ascii');oversizedHeader.writeUInt32BE(100000,16);oversizedHeader.writeUInt32BE(100000,20);
    fs.writeFileSync(path.join(sourceRoot,'public','bomb.png'),oversizedHeader);
    fs.writeFileSync(path.join(sourceRoot,'index.html'),Buffer.from('<img src="/public/hero.png" alt="Hero">'));
    const artifact={root:sourceRoot,files:[
      {path:'public/hero.png',size:originalPng.length},
      {path:'public/hero.jpg',size:25},
      {path:'public/bomb.png',size:oversizedHeader.length},
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
      assert.equal(fs.readFileSync(path.join(workspace.root,'public','bomb.png')).length,oversizedHeader.length,'oversized malformed PNG should remain unchanged');
      assert.equal(workspace.report.assets.find(item=>item.path==='public/bomb.png').reason,'invalid_or_oversized_dimensions');
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
    await assert.rejects(createOptimizedExportWorkspace({root,files:[{path:String.raw`..\\outside`,size:0}]}),/invalid_export_asset_path/);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
