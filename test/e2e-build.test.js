import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';

test('standalone e2e verifier exits cleanly',async()=>{await new Promise((resolve,reject)=>{const p=spawn(process.execPath,['scripts/e2e.mjs'],{cwd:process.cwd(),env:{...process.env},stdio:['ignore','pipe','pipe']});let stdout='',stderr='';p.stdout.on('data',d=>stdout+=d);p.stderr.on('data',d=>stderr+=d);p.on('error',reject);p.on('exit',code=>{if(code!==0)return reject(new Error(`e2e failed: ${stderr||stdout}`));resolve();});});assert.ok(true);});
