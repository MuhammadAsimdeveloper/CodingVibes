import {deflateSync} from 'node:zlib';

const SIZES=new Set([180,192,512]);
const SIGNATURE=Buffer.from([137,80,78,71,13,10,26,10]);

function crc32(buffer){
  let crc=0xffffffff;
  for(const byte of buffer){
    crc^=byte;
    for(let i=0;i<8;i++)crc=(crc&1)?(0xedb88320^(crc>>>1)):(crc>>>1);
  }
  return (crc^0xffffffff)>>>0;
}
function chunk(type,data){
  const name=Buffer.from(type,'ascii');
  const payload=Buffer.concat([name,data]);
  const size=Buffer.alloc(4);size.writeUInt32BE(data.length);
  const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(payload));
  return Buffer.concat([size,payload,crc]);
}
function insideRoundRect(x,y,size,radius){
  const cx=Math.max(radius,Math.min(size-radius,x));
  const cy=Math.max(radius,Math.min(size-radius,y));
  const dx=x-cx,dy=y-cy;
  return dx*dx+dy*dy<=radius*radius;
}
function inRect(x,y,x1,y1,x2,y2){return x>=x1&&x<=x2&&y>=y1&&y<=y2}
function inCircle(x,y,cx,cy,r){const dx=x-cx,dy=y-cy;return dx*dx+dy*dy<=r*r}

export function createAppIconPng(size){
  const dimension=Number(size);
  if(!SIZES.has(dimension))throw new RangeError('Unsupported icon size; supported icon sizes are 180, 192 and 512.');
  const raw=Buffer.alloc((dimension*4+1)*dimension);
  const radius=dimension*.22;
  const scale=dimension;
  for(let y=0;y<scale;y++){
    const row=y*(scale*4+1);raw[row]=0;
    for(let x=0;x<scale;x++){
      const px=x+.5,py=y+.5;
      const offset=row+1+x*4;
      if(!insideRoundRect(px,py,scale,radius)){raw[offset+3]=0;continue;}
      const dx=(px-scale*.5)/(scale*.72),dy=(py-scale*.43)/(scale*.78);
      const glow=Math.max(0,1-Math.sqrt(dx*dx+dy*dy));
      const edge=Math.min(1,Math.min(px,py,scale-px,scale-py)/(scale*.28));
      raw[offset]=Math.round(8+glow*8+edge*2);
      raw[offset+1]=Math.round(14+glow*13+edge*3);
      raw[offset+2]=Math.round(30+glow*28+edge*6);
      raw[offset+3]=255;
      const bMark=
        inRect(px,py,scale*.29,scale*.24,scale*.39,scale*.76)||
        inRect(px,py,scale*.34,scale*.24,scale*.61,scale*.34)||
        inRect(px,py,scale*.34,scale*.45,scale*.60,scale*.55)||
        inRect(px,py,scale*.34,scale*.66,scale*.61,scale*.76)||
        inRect(px,py,scale*.53,scale*.30,scale*.62,scale*.49)||
        inRect(px,py,scale*.53,scale*.50,scale*.62,scale*.70);
      if(bMark){raw[offset]=217;raw[offset+1]=247;raw[offset+2]=226;}
      if(inCircle(px,py,scale*.73,scale*.28,scale*.055)){raw[offset]=125;raw[offset+1]=141;raw[offset+2]=255;}
    }
  }
  const header=Buffer.alloc(13);
  header.writeUInt32BE(scale,0);header.writeUInt32BE(scale,4);header[8]=8;header[9]=6;
  return Buffer.concat([SIGNATURE,chunk('IHDR',header),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
