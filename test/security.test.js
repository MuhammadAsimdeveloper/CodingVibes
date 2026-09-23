import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {normalizeRelative,resolveInside} from '../src/core/safe-path.js';
import {hashPassword,verifyPassword,signSession,verifySessionToken} from '../src/security/auth.js';

test('path policy rejects traversal',()=>{assert.throws(()=>normalizeRelative('../secret'));assert.throws(()=>normalizeRelative('/etc/passwd'));assert.equal(normalizeRelative('src/x.js'),'src/x.js');});
test('password and signed sessions round trip',async()=>{const h=await hashPassword('correct horse battery staple');assert.equal(await verifyPassword('correct horse battery staple',h),true);assert.equal(await verifyPassword('wrong',h),false);const t=signSession('session-id');assert.equal(verifySessionToken(t),'session-id');assert.equal(verifySessionToken(t+'x'),null);});
test('path policy rejects symlink escapes',()=>{const root=fs.mkdtempSync(path.join(os.tmpdir(),'cv-safe-'));const outside=path.join(root,'outside');const inside=path.join(root,'inside');fs.mkdirSync(outside);fs.mkdirSync(inside);fs.writeFileSync(path.join(outside,'secret.txt'),'no');fs.symlinkSync(outside,path.join(inside,'link'),'dir');assert.throws(()=>resolveInside(inside,'link/secret.txt'));});
