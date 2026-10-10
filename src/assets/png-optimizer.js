import {deflateSync,inflateSync} from 'node:zlib';

const SIGNATURE=Buffer.from([137,80,78,71,13,10,26,10]);

function crc32(buffer){
  let crc=0xffffffff;
  for(const byte of buffer){
    crc^=byte;
    for(let bit=0;bit<8;bit++)crc=(crc&1)?(0xedb88320^(crc>>>1)):(crc>>>1);
  }
  return (crc^0xffffffff)>>>0;
}
function encodeChunk(type,data){
  const typeBytes=Buffer.from(type,'ascii');
  const payload=Buffer.concat([typeBytes,data]);
  const length=Buffer.alloc(4);length.writeUInt32BE(data.length);
  const checksum=Buffer.alloc(4);checksum.writeUInt32BE(crc32(payload));
  return Buffer.concat([length,payload,checksum]);
}

/**
 * Losslessly recompresses PNG IDAT data. Pixel/filter bytes and every non-IDAT
 * chunk are preserved. Unsupported or malformed input is returned unchanged.
 */
export function optimizePngBuffer(input){
  if(!Buffer.isBuffer(input)||input.length<8||!input.subarray(0,8).equals(SIGNATURE)){
    return {supported:false,buffer:input,bytesSaved:0,reason:'not-png'};
  }
  try{
    let offset=8,header=null,ended=false;
    const chunks=[],imageData=[];
    while(offset<input.length){
      if(offset+12>input.length)throw new Error('truncated chunk');
      const length=input.readUInt32BE(offset);offset+=4;
      if(length>input.length-offset-8)throw new Error('invalid chunk length');
      const type=input.toString('ascii',offset,offset+4);offset+=4;
      const data=input.subarray(offset,offset+length);offset+=length;
      const expected=input.readUInt32BE(offset);offset+=4;
      if(crc32(Buffer.concat([Buffer.from(type,'ascii'),data]))!==expected)throw new Error('invalid chunk checksum');
      if(type==='IHDR'){
        if(header||length!==13)throw new Error('invalid IHDR');
        header=Buffer.from(data);
      }
      if(type==='IDAT')imageData.push(data);
      else chunks.push({type,data:Buffer.from(data)});
      if(type==='IEND'){ended=true;break;}
    }
    if(!header||imageData.length===0||!ended)throw new Error('incomplete PNG');
    // Validate the zlib stream before accepting an optimization.
    const raw=inflateSync(Buffer.concat(imageData));
    const compressed=deflateSync(raw,{level:9});
    const idat=encodeChunk('IDAT',compressed);
    const rebuilt=[SIGNATURE];
    let inserted=false;
    for(const chunk of chunks){
      if(chunk.type==='IEND'&&!inserted){rebuilt.push(idat);inserted=true;}
      rebuilt.push(encodeChunk(chunk.type,chunk.data));
    }
    if(!inserted)throw new Error('missing IEND');
    const candidate=Buffer.concat(rebuilt);
    const buffer=candidate.length<input.length?candidate:input;
    return {supported:true,buffer,bytesSaved:input.length-buffer.length,originalBytes:input.length,optimizedBytes:buffer.length};
  }catch(error){
    return {supported:false,buffer:input,bytesSaved:0,reason:error instanceof Error?error.message:'invalid-png'};
  }
}
