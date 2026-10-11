import test from 'node:test';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {PNG} from 'pngjs';
import {PROVIDERS} from '../src/deployment/providers.js';

function makeLargePng(width=2500,height=1250){
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
function makeArtifact(root,bytes){
  fs.mkdirSync(path.join(root,'public'),{recursive:true});
  fs.writeFileSync(path.join(root,'public','hero.png'),bytes);
  fs.writeFileSync(path.join(root,'index.html'),'<img src="/public/hero.png" alt="Hero">');
  const model=Buffer.from('glTFbinary-3d-model-payload');
  fs.writeFileSync(path.join(root,'public','model.glb'),model);
  return {
    root,
    files:[{path:'public/hero.png',size:bytes.length},{path:'index.html',size:39},{path:'public/model.glb',size:model.length}],
    framework:'static-html',
    buildCommand:null,
    outputDirectory:'',
    projectMetadata:{name:'media-optimization-fixture',version:'1.0.0'},
    deploymentMetadata:{serverRequired:false,missingFiles:[],secrets:[]},
    fingerprint:'fixture-fingerprint'
  };
}
function jsonResponse(body,status=200){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});}

test('Vercel direct-file deployment uploads optimized raster bytes while preserving source and asset paths',async()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'build-vibe-vercel-media-'));
  const source=makeLargePng();
  const artifact=makeArtifact(root,source);
  const previousFetch=globalThis.fetch;
  const uploads=[];
  let deploymentPayload=null;
  try{
    globalThis.fetch=async(url,init={})=>{
      const href=String(url);
      if(href==='https://api.vercel.com/v2/files'){
        uploads.push({bytes:Buffer.from(init.body),headers:init.headers});
        return new Response('',{status:200});
      }
      if(href==='https://api.vercel.com/v13/deployments'){deploymentPayload=JSON.parse(init.body);return jsonResponse({readyState:'READY',id:'vercel-media-fixture',url:'media-fixture.vercel.app',projectId:'fixture-project'});}
      throw new Error('unexpected network URL '+href);
    };
    const result=await PROVIDERS.vercel.deploy({artifact,credentials:{accessToken:'test-token'},options:{projectName:'media-fixture'}});
    assert.equal(result.status,'READY');
    assert.equal(result.optimization.optimized,1);
    assert.ok(result.optimization.savedBytes>0);
    assert.deepEqual(uploads.map(item=>item.headers['content-type']),['application/octet-stream','application/octet-stream','application/octet-stream']);
    assert.equal(uploads[0].headers['x-vercel-digest'],crypto.createHash('sha1').update(uploads[0].bytes).digest('hex'),'Vercel digest must match the uploaded optimized bytes');
    const optimizedPng=PNG.sync.read(uploads[0].bytes);
    assert.equal(optimizedPng.width,1920);
    assert.ok(optimizedPng.height<1250);
    assert.equal(uploads.length,2);
    assert.deepEqual(deploymentPayload.files.map(file=>file.file).sort(),['index.html','public/hero.png','public/model.glb']);
    assert.equal(deploymentPayload.files.find(file=>file.file==='public/hero.png').size,uploads[0].bytes.length);
    assert.deepEqual(fs.readFileSync(path.join(root,'public','hero.png')),source,'deployment must not mutate the project source');
  }finally{
    globalThis.fetch=previousFetch;
    fs.rmSync(root,{recursive:true,force:true});
  }
});

test('Cloudflare Pages direct-file deployment receives optimized raster bytes and retains relative manifest paths',async()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'build-vibe-cloudflare-media-'));
  const source=makeLargePng();
  const artifact=makeArtifact(root,source);
  const previousFetch=globalThis.fetch;
  let uploadedImage=null;
  let uploadedModelContentType=null;
  let manifest=null;
  try{
    globalThis.fetch=async(url,init={})=>{
      const href=String(url);
      if(href.endsWith('/pages/projects/media-optimization-fixture'))return jsonResponse({success:true,result:{}});
      if(href.endsWith('/pages/projects/media-optimization-fixture/upload-token'))return jsonResponse({success:true,result:{jwt:'test-upload-jwt'}});
      if(href.endsWith('/pages/assets/upload')){
        for(const asset of JSON.parse(init.body)){
          const bytes=Buffer.from(asset.value,'base64');
          if(bytes.toString('hex',0,8)==='89504e470d0a1a0a')uploadedImage=bytes;
          if(bytes.toString('utf8',0,4)==='glTF')uploadedModelContentType=asset.metadata?.contentType||null;
        }
        return jsonResponse({success:true,result:{}});
      }
      if(href.endsWith('/pages/projects/media-optimization-fixture/deployments')){
        manifest=JSON.parse(init.body.get('manifest'));
        return jsonResponse({success:true,result:{id:'cloudflare-media-fixture',latest_stage:{status:'active'},aliases:['media-fixture.pages.dev']}});
      }
      throw new Error('unexpected network URL '+href);
    };
    const result=await PROVIDERS.cloudflare.deploy({artifact,credentials:{accessToken:'test-token',accountId:'account-fixture'},options:{projectName:'media-optimization-fixture'}});
    assert.equal(result.status,'active');
    assert.equal(result.optimization.optimized,1);
    assert.ok(uploadedImage,'a PNG should be present in the direct-upload batch');
    const optimizedPng=PNG.sync.read(uploadedImage);
    assert.equal(optimizedPng.width,1920);
    assert.deepEqual(Object.keys(manifest).sort(),['index.html','public/hero.png','public/model.glb']);
    assert.equal(uploadedModelContentType,'model/gltf-binary');
    assert.deepEqual(fs.readFileSync(path.join(root,'public','hero.png')),source,'deployment must not mutate the project source');
  }finally{
    globalThis.fetch=previousFetch;
    fs.rmSync(root,{recursive:true,force:true});
  }
});
