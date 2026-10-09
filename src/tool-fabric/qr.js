const SPECS = [
  {version:1,size:21,data:19,ecc:7,maxBytes:17,alignment:[]},
  {version:2,size:25,data:34,ecc:10,maxBytes:32,alignment:[18]},
  {version:3,size:29,data:55,ecc:15,maxBytes:53,alignment:[22]},
  {version:4,size:33,data:80,ecc:20,maxBytes:78,alignment:[26]}
];

function multiply(a,b) {
  let result=0;
  while(b) {
    if(b&1) result^=a;
    a<<=1;
    if(a&0x100) a^=0x11d;
    b>>=1;
  }
  return result;
}
function generatorPolynomial(degree) {
  let result=[1],root=1;
  for(let i=0;i<degree;i++) {
    const next=Array(result.length+1).fill(0);
    for(let j=0;j<result.length;j++) {
      next[j]^=result[j];
      next[j+1]^=multiply(result[j],root);
    }
    result=next;
    root=multiply(root,2);
  }
  return result;
}
function errorCorrection(data,degree) {
  const generator=generatorPolynomial(degree);
  const buffer=data.concat(Array(degree).fill(0));
  for(let i=0;i<data.length;i++) {
    const factor=buffer[i];
    if(!factor) continue;
    for(let j=0;j<generator.length;j++) buffer[i+j]^=multiply(generator[j],factor);
  }
  return buffer.slice(data.length);
}
function appendBits(bits,value,length) {
  for(let i=length-1;i>=0;i--) bits.push((value>>>i)&1);
}
function codewords(text,spec) {
  const input=Array.from(Buffer.from(text,'utf8'));
  if(input.length>spec.maxBytes) throw new Error('QR payload exceeds the supported '+spec.maxBytes+' UTF-8 byte limit.');
  const bits=[];
  appendBits(bits,4,4); // Byte mode
  appendBits(bits,input.length,8); // Versions 1–4 use an 8-bit byte count
  for(const byte of input) appendBits(bits,byte,8);
  const capacity=spec.data*8;
  if(bits.length>capacity) throw new Error('QR payload does not fit the selected version.');
  for(let i=0;i<Math.min(4,capacity-bits.length);i++) bits.push(0);
  while(bits.length%8) bits.push(0);
  const data=[];
  for(let i=0;i<bits.length;i+=8) {
    let value=0;
    for(let j=0;j<8;j++) value=(value<<1)|bits[i+j];
    data.push(value);
  }
  for(let pad=0;data.length<spec.data;pad++) data.push(pad%2===0?0xec:0x11);
  const combined=data.concat(errorCorrection(data,spec.ecc));
  const out=[];
  for(const byte of combined) for(let i=7;i>=0;i--) out.push((byte>>>i)&1);
  return out;
}
export function generateQrMatrix(text) {
  const content=String(text||'');
  if(!content) throw new Error('QR text is required.');
  if(Buffer.byteLength(content,'utf8')>78) throw new Error('QR payload exceeds the supported 78 UTF-8 byte limit.');
  const spec=SPECS.find(item=>Buffer.byteLength(content,'utf8')<=item.maxBytes);
  const size=spec.size;
  const matrix=Array.from({length:size},()=>Array(size).fill(false));
  const reserved=Array.from({length:size},()=>Array(size).fill(false));
  const setFunction=(row,col,dark)=>{
    if(row<0||col<0||row>=size||col>=size) return;
    matrix[row][col]=Boolean(dark);
    reserved[row][col]=true;
  };
  const finder=(top,left)=>{
    for(let dy=-1;dy<=7;dy++) for(let dx=-1;dx<=7;dx++) {
      const row=top+dy,col=left+dx;
      if(row<0||col<0||row>=size||col>=size) continue;
      const within=dy>=0&&dy<=6&&dx>=0&&dx<=6;
      const dark=within&&(dy===0||dy===6||dx===0||dx===6||(dy>=2&&dy<=4&&dx>=2&&dx<=4));
      setFunction(row,col,dark);
    }
  };
  finder(0,0);
  finder(0,size-7);
  finder(size-7,0);

  if(spec.version>1) {
    const center=spec.alignment[0];
    const positions=[[center,center]];
    for(const pair of positions) {
      const cy=pair[0],cx=pair[1];
      if(reserved[cy][cx]) continue;
      for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++) {
        const dark=Math.max(Math.abs(dx),Math.abs(dy))!==1;
        setFunction(cy+dy,cx+dx,dark);
      }
    }
  }
  for(let i=8;i<size-8;i++) {
    if(!reserved[6][i]) setFunction(6,i,i%2===0);
    if(!reserved[i][6]) setFunction(i,6,i%2===0);
  }
  // Reserve format-information modules before placing payload bits.
  for(let i=0;i<=5;i++) reserved[i][8]=true;
  reserved[7][8]=true; reserved[8][8]=true; reserved[8][7]=true;
  for(let i=9;i<15;i++) reserved[8][14-i]=true;
  for(let i=0;i<8;i++) reserved[8][size-1-i]=true;
  for(let i=8;i<15;i++) reserved[size-15+i][8]=true;
  setFunction(size-8,8,true);

  const payload=codewords(content,spec);
  let bitIndex=0;
  for(let right=size-1;right>=1;right-=2) {
    if(right===6) right--;
    const upward=((right+1)&2)===0;
    for(let vert=0;vert<size;vert++) {
      const row=upward?size-1-vert:vert;
      for(let offset=0;offset<2;offset++) {
        const col=right-offset;
        if(reserved[row][col]) continue;
        const bit=bitIndex<payload.length?payload[bitIndex]:0;
        const masked=(row+col)%2===0;
        matrix[row][col]=Boolean(bit^(masked?1:0));
        reserved[row][col]=true;
        bitIndex++;
      }
    }
  }
  // Format data: error correction L (01) and mask pattern 0.
  const data=(1<<3)|0;
  let remainder=data<<10;
  for(let bit=14;bit>=10;bit--) if((remainder>>>bit)&1) remainder^=0x537<<(bit-10);
  const formatBits=((data<<10)|remainder)^0x5412;
  const bitAt=(index)=>((formatBits>>>index)&1)!==0;
  for(let i=0;i<=5;i++) matrix[i][8]=bitAt(i);
  matrix[7][8]=bitAt(6);
  matrix[8][8]=bitAt(7);
  matrix[8][7]=bitAt(8);
  for(let i=9;i<15;i++) matrix[8][14-i]=bitAt(i);
  for(let i=0;i<8;i++) matrix[8][size-1-i]=bitAt(i);
  for(let i=8;i<15;i++) matrix[size-15+i][8]=bitAt(i);
  matrix[size-8][8]=true;
  return {version:spec.version,size,matrix};
}
export function generateQrSvg(text) {
  const qr=generateQrMatrix(text);
  const quiet=4;
  const paths=[];
  for(let row=0;row<qr.size;row++) for(let col=0;col<qr.size;col++) {
    if(qr.matrix[row][col]) paths.push('M'+col+' '+row+'h1v1h-1z');
  }
  const dimension=qr.size+quiet*2;
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-'+quiet+' -'+quiet+' '+dimension+' '+dimension+'" role="img" aria-label="QR code" shape-rendering="crispEdges"><rect x="-'+quiet+'" y="-'+quiet+'" width="'+dimension+'" height="'+dimension+'" fill="#fff"/><path fill="#000" d="'+paths.join(' ')+'"/></svg>';
}
