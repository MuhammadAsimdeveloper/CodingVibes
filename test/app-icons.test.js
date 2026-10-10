import test from 'node:test';
import assert from 'node:assert/strict';
import {inflateSync} from 'node:zlib';
import {createAppIconPng} from '../src/site/icons.js';

function decodePngHeader(buffer){
  assert.equal(buffer.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  let offset=8,width=0,height=0,idat=[];
  while(offset<buffer.length){
    const length=buffer.readUInt32BE(offset);offset+=4;
    const type=buffer.toString('ascii',offset,offset+4);offset+=4;
    const data=buffer.subarray(offset,offset+length);offset+=length+4;
    if(type==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);assert.equal(data[8],8);assert.equal(data[9],6);}
    if(type==='IDAT')idat.push(data);
    if(type==='IEND')break;
  }
  return {width,height,raw:inflateSync(Buffer.concat(idat))};
}

test('platform app icons are valid RGBA PNGs at supported install sizes',()=>{
  for(const size of [180,192,512]){
    const png=createAppIconPng(size);
    assert.ok(Buffer.isBuffer(png));
    const decoded=decodePngHeader(png);
    assert.equal(decoded.width,size);
    assert.equal(decoded.height,size);
    assert.equal(decoded.raw.length,size*(size*4+1));
    assert.ok(png.length>500,'icon must contain real artwork, not an empty placeholder');
  }
});

test('app icon artwork has opaque background and multiple visible colors',()=>{
  const {raw}=decodePngHeader(createAppIconPng(192));
  const stride=192*4+1;
  const pixel=(x,y)=>Array.from(raw.subarray(y*stride+1+x*4,y*stride+1+x*4+4));
  assert.equal(pixel(0,0)[3],0,'rounded corners should be transparent');
  assert.equal(pixel(96,96)[3],255,'center mark should be opaque');
  const colors=new Set();
  for(let y=0;y<192;y+=4)for(let x=0;x<192;x+=4)colors.add(pixel(x,y).join(','));
  assert.ok(colors.size>20,'icon should have a recognizable multi-color mark and background');
});

test('unsupported app icon dimensions are rejected',()=>{
  assert.throws(()=>createAppIconPng(64),/supported icon size/i);
});
