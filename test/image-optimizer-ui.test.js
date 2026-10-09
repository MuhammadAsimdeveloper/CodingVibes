import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {optimizeImageInBrowser} from '../src/tool-fabric/browser.js';

const root = new URL('../', import.meta.url);
const html = fs.readFileSync(new URL('public/index.html', root), 'utf8');
const studio = fs.readFileSync(new URL('public/studio.js', root), 'utf8');
const browserAdapter = fs.readFileSync(new URL('public/tool-fabric-browser.js', root), 'utf8');

function withBrowserCanvas({width=4000,height=2000,encodedType='image/webp',blobSize=8}={}, run) {
  const keys = ['createImageBitmap','OffscreenCanvas','document'];
  const previous = new Map(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis,key)]));
  let closed = false;
  let drawn = null;
  let encoding = null;
  globalThis.createImageBitmap = async () => ({width,height,close(){closed=true;}});
  globalThis.OffscreenCanvas = class {
    constructor(w,h) { this.width=w; this.height=h; }
    getContext() { return {drawImage(_bitmap,x,y,w,h){drawn={x,y,w,h};}}; }
    async convertToBlob(options) { encoding=options; return new Blob([new Uint8Array(blobSize)],{type:encodedType}); }
  };
  globalThis.document = {createElement(){throw new Error('OffscreenCanvas should be used');}};
  return Promise.resolve().then(() => run({
    get closed(){return closed;},
    get drawn(){return drawn;},
    get encoding(){return encoding;}
  })).finally(() => {
    for (const key of keys) {
      const descriptor=previous.get(key);
      if (descriptor) Object.defineProperty(globalThis,key,descriptor);
      else delete globalThis[key];
    }
  });
}

test('browser image optimizer bounds dimensions and reports local-only output', async () => {
  await withBrowserCanvas({}, async browser => {
    const file=new Blob([new Uint8Array(16)],{type:'image/png'});
    Object.defineProperty(file,'name',{value:'cover.png'});
    const result=await optimizeImageInBrowser(file,{type:'image/webp',quality:0.7,maxWidth:1920,maxHeight:1920});
    assert.equal(result.width,1920);
    assert.equal(result.height,960);
    assert.equal(result.mimeType,'image/webp');
    assert.equal(result.fileName,'cover.webp');
    assert.equal(result.networkUsed,false);
    assert.equal(result.blob.size,8);
    assert.deepEqual(browser.drawn,{x:0,y:0,w:1920,h:960});
    assert.deepEqual(browser.encoding,{type:'image/webp',quality:0.7});
    assert.equal(browser.closed,true);
  });
});

test('browser image optimizer rejects non-image blobs without decoding them', async () => {
  const previous=Object.getOwnPropertyDescriptor(globalThis,'createImageBitmap');
  let decodeCalls=0;
  globalThis.createImageBitmap=async()=>{decodeCalls++;throw new Error('must not decode');};
  try {
    await assert.rejects(
      optimizeImageInBrowser(new Blob(['text'],{type:'text/plain'})),
      error => error.code==='INVALID_INPUT'
    );
    assert.equal(decodeCalls,0);
  } finally {
    if(previous) Object.defineProperty(globalThis,'createImageBitmap',previous);
    else delete globalThis.createImageBitmap;
  }
});

test('browser image optimizer rejects unsupported encoders rather than mislabelling a PNG as WebP', async () => {
  await withBrowserCanvas({encodedType:'image/png'}, async () => {
    const file=new Blob([new Uint8Array(16)],{type:'image/png'});
    await assert.rejects(
      optimizeImageInBrowser(file,{type:'image/webp'}),
      error => error.code==='BROWSER_REQUIRED' && /cannot encode/i.test(error.message)
    );
  });
});

test('Studio includes an accessible, local-only image optimizer and uses the canonical browser adapter', () => {
  for (const id of ['imageOptimizeFile','imageOptimizeFormat','imageOptimizeQuality','imageOptimizeMaxWidth','imageOptimizeButton','imageOptimizeStatus','imageOptimizePreview','imageOptimizeDownload']) {
    assert.match(html,new RegExp('id="' + id + '"'));
  }
  assert.ok(html.includes('accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/bmp"'));
  assert.match(html,/aria-live="polite"/);
  assert.match(html,/Processed in this browser; the selected file is never uploaded\./);
  assert.match(studio,/import \{optimizeImageInBrowser\} from '\.\/tool-fabric-browser\.js'/);
  assert.match(studio,/async function optimizeSelectedImage\(/);
  assert.match(studio,/optimizeImageInBrowser\(/);
  assert.match(studio,/URL\.createObjectURL\(/);
  assert.match(studio,/URL\.revokeObjectURL\(/);
});

test('browser image optimizer rejects empty and over-25-MiB files before decoding', async () => {
  const previous=Object.getOwnPropertyDescriptor(globalThis,'createImageBitmap');
  let decodeCalls=0;
  globalThis.createImageBitmap=async()=>{decodeCalls++;throw new Error('must not decode');};
  try {
    await assert.rejects(
      optimizeImageInBrowser(new Blob([],{type:'image/png'})),
      error => error.code==='INVALID_INPUT'
    );
    const large=new Blob([new Uint8Array(25*1024*1024+1)],{type:'image/png'});
    await assert.rejects(
      optimizeImageInBrowser(large),
      error => error.code==='INPUT_TOO_LARGE'
    );
    assert.equal(decodeCalls,0);
  } finally {
    if(previous) Object.defineProperty(globalThis,'createImageBitmap',previous);
    else delete globalThis.createImageBitmap;
  }
});

test('browser image optimizer refuses SVG files before decoding their contents', async () => {
  const previous=Object.getOwnPropertyDescriptor(globalThis,'createImageBitmap');
  let decodeCalls=0;
  globalThis.createImageBitmap=async()=>{decodeCalls++;throw new Error('must not decode');};
  try {
    await assert.rejects(
      optimizeImageInBrowser(new Blob(['<svg></svg>'],{type:'image/svg+xml'})),
      error => error.code==='INVALID_INPUT'
    );
    assert.equal(decodeCalls,0);
  } finally {
    if(previous) Object.defineProperty(globalThis,'createImageBitmap',previous);
    else delete globalThis.createImageBitmap;
  }
});
