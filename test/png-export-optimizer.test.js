import test from 'node:test';
import assert from 'node:assert/strict';
import {inflateSync} from 'node:zlib';
import {createAppIconPng} from '../src/site/icons.js';
import {optimizePngBuffer} from '../src/assets/png-optimizer.js';

function decodePng(buffer){
  let offset=8,header=null,idat=[];
  while(offset<buffer.length){
    const length=buffer.readUInt32BE(offset);offset+=4;
    const type=buffer.toString('ascii',offset,offset+4);offset+=4;
    const data=buffer.subarray(offset,offset+length);offset+=length+4;
    if(type==='IHDR')header=Buffer.from(data);
    if(type==='IDAT')idat.push(data);
    if(type==='IEND')break;
  }
  return {header,raw:inflateSync(Buffer.concat(idat))};
}

test('PNG export optimization preserves decoded pixels and dimensions losslessly',()=>{
  const source=createAppIconPng(180);
  const result=optimizePngBuffer(source);
  assert.equal(result.supported,true);
  assert.ok(result.buffer.length<=source.length);
  const before=decodePng(source),after=decodePng(result.buffer);
  assert.deepEqual(after.header,before.header);
  assert.deepEqual(after.raw,before.raw);
  assert.equal(result.bytesSaved,source.length-result.buffer.length);
});

test('PNG optimizer safely leaves unsupported or malformed images unchanged',()=>{
  const invalid=Buffer.from('not a png');
  const result=optimizePngBuffer(invalid);
  assert.equal(result.supported,false);
  assert.equal(result.buffer,invalid);
  assert.equal(result.bytesSaved,0);
});

test('PNG optimizer retains transparency and ancillary chunks',()=>{
  const source=createAppIconPng(192);
  const result=optimizePngBuffer(source);
  const text=Buffer.from('test metadata');
  const signature=Buffer.from([137,80,78,71,13,10,26,10]);
  assert.equal(result.buffer.subarray(0,8).toString('hex'),signature.toString('hex'));
  assert.equal(decodePng(result.buffer).header[9],6,'RGBA alpha channel remains intact');
});
