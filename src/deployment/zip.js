import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function crc32(buf){let c=0xffffffff;for(const byte of buf){c^=byte;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0)}return(c^0xffffffff)>>>0}
function dosDateTime(date=new Date()){const d=((date.getFullYear()-1980)<<9)|((date.getMonth()+1)<<5)|date.getDate();const t=(date.getHours()<<11)|(date.getMinutes()<<5)|Math.floor(date.getSeconds()/2);return[d,t]}
function u16(n){const b=Buffer.alloc(2);b.writeUInt16LE(n);return b}
function u32(n){const b=Buffer.alloc(4);b.writeUInt32LE(n>>>0);return b}
const STORE_EXTENSIONS=new Set(['.png','.jpg','.jpeg','.webp','.avif','.gif','.bmp','.ico','.heic','.heif','.mp4','.m4v','.mov','.webm','.mp3','.m4a','.aac','.ogg','.opus','.pdf','.zip','.gz','.br','.woff','.woff2']);
export function zipDirectory(root,outFile,{ignore=[]}={}){
 const abs=path.resolve(root),files=[];const skip=new Set(ignore);
 const walk=(dir)=>{for(const e of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,e.name),rel=path.relative(abs,full).split(path.sep).join('/');if(skip.has(rel)||e.name==='.git'||e.name==='node_modules'||e.name==='.codingvibes')continue;if(e.isDirectory())walk(full);else if(e.isFile())files.push({rel,full})}};walk(abs);
 const chunks=[],central=[];let offset=0;for(const f of files){const data=fs.readFileSync(f.full),method=STORE_EXTENSIONS.has(path.extname(f.rel).toLowerCase())?0:8,compressed=method===0?data:zlib.deflateRawSync(data,{level:9}),[time,date]=dosDateTime();const name=Buffer.from(f.rel);const local=Buffer.concat([Buffer.from([0x50,0x4b,0x03,0x04]),u16(20),u16(0),u16(method),u16(time),u16(date),u32(crc32(data)),u32(compressed.length),u32(data.length),u16(name.length),u16(0),name,compressed]);chunks.push(local);const c=Buffer.concat([Buffer.from([0x50,0x4b,0x01,0x02]),u16(20),u16(20),u16(0),u16(method),u16(time),u16(date),u32(crc32(data)),u32(compressed.length),u32(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),name]);central.push(c);offset+=local.length}
 const centralBuf=Buffer.concat(central),body=Buffer.concat(chunks),eocd=Buffer.concat([Buffer.from([0x50,0x4b,0x05,0x06]),u16(0),u16(0),u16(files.length),u16(files.length),u32(centralBuf.length),u32(body.length),u16(0)]);fs.mkdirSync(path.dirname(path.resolve(outFile)),{recursive:true});fs.writeFileSync(outFile,Buffer.concat([body,centralBuf,eocd]));return{file:outFile,files:files.length,size:fs.statSync(outFile).size};
}
