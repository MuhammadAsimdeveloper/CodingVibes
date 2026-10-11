import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {inflateRawSync} from 'node:zlib';
import {zipDirectory} from '../src/deployment/zip.js';

function localEntries(zip) {
  const entries = new Map();
  let offset = 0;
  while (offset + 4 <= zip.length && zip.readUInt32LE(offset) === 0x04034b50) {
    const method = zip.readUInt16LE(offset + 8);
    const compressedSize = zip.readUInt32LE(offset + 18);
    const nameLength = zip.readUInt16LE(offset + 26);
    const extraLength = zip.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const name = zip.toString('utf8', nameStart, nameStart + nameLength);
    const dataStart = nameStart + nameLength + extraLength;
    const data = zip.subarray(dataStart, dataStart + compressedSize);
    entries.set(name, {method, data: method === 8 ? inflateRawSync(data) : Buffer.from(data)});
    offset = dataStart + compressedSize;
  }
  return entries;
}

test('export ZIP stores already-compressed raster and media assets without altering bytes', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'build-vibe-export-zip-'));
  const output = path.join(root, 'export.zip');
  const files = path.join(root, 'project');
  fs.mkdirSync(files);
  const assets = new Map([
    ['public/photo.png', Buffer.from([137,80,78,71,13,10,26,10,0,1,2,3])],
    ['public/photo.jpg', Buffer.from([255,216,255,219,4,5,6])],
    ['public/photo.webp', Buffer.from('RIFF0000WEBPpayload')],
    ['public/demo.mp4', Buffer.from('ftypmp4 payload')]
  ]);
  for (const [name, bytes] of assets) {
    const target = path.join(files, name);
    fs.mkdirSync(path.dirname(target), {recursive:true});
    fs.writeFileSync(target, bytes);
  }
  const result = zipDirectory(files, output);
  assert.equal(result.files, assets.size);
  const entries = localEntries(fs.readFileSync(output));
  for (const [name, bytes] of assets) {
    assert.equal(entries.get(name).method, 0, name + ' should use ZIP store mode');
    assert.deepEqual(entries.get(name).data, bytes, name + ' bytes must remain unchanged');
  }
  fs.rmSync(root, {recursive:true, force:true});
});

test('export ZIP still deflates text assets and restores their exact content', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'build-vibe-export-text-'));
  const source = path.join(root, 'project');
  fs.mkdirSync(source);
  const content = '<html><body>' + 'build-vibe '.repeat(500) + '</body></html>';
  fs.writeFileSync(path.join(source, 'index.html'), content);
  const output = path.join(root, 'export.zip');
  zipDirectory(source, output);
  const entry = localEntries(fs.readFileSync(output)).get('index.html');
  assert.equal(entry.method, 8, 'text should remain deflated');
  assert.equal(entry.data.toString('utf8'), content);
  fs.rmSync(root, {recursive:true, force:true});
});
