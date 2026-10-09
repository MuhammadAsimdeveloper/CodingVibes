import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {deflateSync} from 'node:zlib';
import {chromium} from 'playwright';

const publicRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../public');
const contentTypes={
  '.html':'text/html; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.svg':'image/svg+xml',
  '.png':'image/png',
  '.ico':'image/x-icon'
};
const apiRequests=[];

function crc32(bytes){
  let crc=0xffffffff;
  for(const byte of bytes){
    crc^=byte;
    for(let i=0;i<8;i++)crc=(crc&1)?(0xedb88320^(crc>>>1)):(crc>>>1);
  }
  return (crc^0xffffffff)>>>0;
}
function pngChunk(name,data){
  const type=Buffer.from(name,'ascii');
  const payload=Buffer.concat([type,data]);
  const length=Buffer.alloc(4);length.writeUInt32BE(data.length);
  const checksum=Buffer.alloc(4);checksum.writeUInt32BE(crc32(payload));
  return Buffer.concat([length,payload,checksum]);
}
function onePixelPng(){
  const signature=Buffer.from([137,80,78,71,13,10,26,10]);
  const header=Buffer.alloc(13);
  header.writeUInt32BE(1,0);header.writeUInt32BE(1,4);
  header[8]=8;header[9]=6;header[10]=0;header[11]=0;header[12]=0;
  const pixels=deflateSync(Buffer.from([0,255,0,0,255]));
  return Buffer.concat([signature,pngChunk('IHDR',header),pngChunk('IDAT',pixels),pngChunk('IEND',Buffer.alloc(0))]);
}

const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url||'/', 'http://127.0.0.1');
  if(url.pathname.startsWith('/api/')){
    apiRequests.push({method:req.method,path:url.pathname});
    res.setHeader('content-type','application/json; charset=utf-8');
    if(url.pathname==='/api/auth/me')return res.end(JSON.stringify({user:null}));
    if(url.pathname==='/api/auth/google/config')return res.end(JSON.stringify({configured:false}));
    res.statusCode=401;return res.end(JSON.stringify({error:'test_api_not_configured'}));
  }
  let pathname=url.pathname;
  if(pathname==='/app')pathname='/index.html';
  if(pathname==='/')pathname='/landing.html';
  try{pathname=decodeURIComponent(pathname);}catch{res.statusCode=400;return res.end('Bad request');}
  const file=path.resolve(publicRoot,'.'+pathname);
  if(file===publicRoot||!file.startsWith(publicRoot+path.sep)){res.statusCode=403;return res.end('Forbidden');}
  try{
    const stat=await fs.stat(file);
    if(!stat.isFile()){res.statusCode=404;return res.end('Not found');}
    const body=await fs.readFile(file);
    res.setHeader('content-type',contentTypes[path.extname(file).toLowerCase()]||'application/octet-stream');
    res.setHeader('x-content-type-options','nosniff');
    res.setHeader('cache-control','no-store');
    return res.end(body);
  }catch{
    res.statusCode=404;return res.end('Not found');
  }
});

await new Promise((resolve,reject)=>{
  server.once('error',reject);
  server.listen(0,'127.0.0.1',resolve);
});
let browser;
try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({acceptDownloads:true});
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(error.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/app',{waitUntil:'networkidle',timeout:30000});
  assert.ok(await page.locator('#imageOptimizeFile').count(),'Studio image optimizer controls should load');
  await page.evaluate(()=>{
    document.querySelector('#appView')?.classList.remove('hidden');
    document.querySelector('#tab-content')?.classList.remove('hidden');
  });
  await page.locator('#imageOptimizeFile').setInputFiles({
    name:'pixel.png',
    mimeType:'image/png',
    buffer:onePixelPng()
  });
  const apiCountBefore=apiRequests.length;
  await page.locator('#imageOptimizeButton').click();
  await page.waitForFunction(
    ()=>document.querySelector('#imageOptimizeStatus')?.textContent?.includes('Image optimized locally.'),
    null,
    {timeout:20000}
  );
  const preview=await page.locator('#imageOptimizePreview').evaluate(img=>({
    src:img.src,width:img.naturalWidth,height:img.naturalHeight,alt:img.alt
  }));
  assert.match(preview.src,/^blob:/);
  assert.equal(preview.width,1);
  assert.equal(preview.height,1);
  assert.match(preview.alt,/pixel\.webp/);
  const downloadPromise=page.waitForEvent('download',{timeout:10000});
  await page.locator('#imageOptimizeDownload').click();
  const download=await downloadPromise;
  assert.equal(download.suggestedFilename(),'pixel.webp');

  const previousPreview=preview.src;
  await page.locator('#imageOptimizeFile').setInputFiles({
    name:'invalid.svg',
    mimeType:'image/svg+xml',
    buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')
  });
  await page.locator('#imageOptimizeButton').click();
  await page.waitForFunction(
    ()=>document.querySelector('#imageOptimizeStatus')?.textContent?.includes('INVALID_INPUT'),
    null,
    {timeout:5000}
  );
  assert.equal(await page.locator('#imageOptimizePreview').getAttribute('src'),previousPreview);
  assert.equal(apiRequests.length,apiCountBefore,'image optimization must not send a request to the server');
  assert.deepEqual(pageErrors,[]);
  console.log(JSON.stringify({
    ok:true,
    status:'PASS',
    browser:'Chromium',
    sourceBytes:onePixelPng().length,
    outputName:download.suggestedFilename(),
    preview:'1x1',
    networkRequestsDuringOptimization:apiRequests.length-apiCountBefore
  },null,2));
}finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
