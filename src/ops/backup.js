import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';

function safeBackupPath(root){
  const base=path.resolve(root);fs.mkdirSync(base,{recursive:true});return base;
}
export function backupStore(store,root=process.env.CODINGVIBES_BACKUP_ROOT||'./data/backups'){
  const dir=safeBackupPath(root);const stamp=new Date().toISOString().replace(/[:.]/g,'-');const target=path.join(dir,`codingvibes-${stamp}.db`);
  if(fs.existsSync(target))fs.rmSync(target,{force:true});
  store.db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
  const escaped=target.replaceAll("'","''");
  store.db.exec(`VACUUM INTO '${escaped}'`);
  const stat=fs.statSync(target);const sha=createHash('sha256').update(fs.readFileSync(target)).digest('hex');
  return {path:target,size:stat.size,sha256:sha,createdAt:new Date().toISOString()};
}


function hashFile(file) {
  const digest=createHash('sha256'),fd=fs.openSync(file,'r'),buffer=Buffer.allocUnsafe(1024*1024);
  try {
    let count=0;
    while((count=fs.readSync(fd,buffer,0,buffer.length,null))>0)digest.update(buffer.subarray(0,count));
    return digest.digest('hex');
  } finally {
    fs.closeSync(fd);
  }
}

/**
 * Verify an on-disk SQLite backup without running migrations or modifying the file.
 * The expected hash is optional, but a caller-supplied invalid/mismatched hash fails closed.
 */
export function verifyBackup(file,{expectedSha256=null}={}) {
  const input=String(file||'').trim();
  if(!input)return {ok:false,status:'BLOCKED',reason:'backup_file_required'};
  let target,stat;
  try {
    target=path.resolve(input);
    const entry=fs.lstatSync(target);
    if(entry.isSymbolicLink()||!entry.isFile())return {ok:false,status:'BLOCKED',reason:'backup_path_must_be_regular_file'};
    stat=entry;
  } catch {
    return {ok:false,status:'BLOCKED',reason:'backup_file_unavailable'};
  }
  if(stat.size<=0)return {ok:false,status:'FAIL',reason:'backup_file_empty',size:stat.size};
  let actualSha256;
  try { actualSha256=hashFile(target); }
  catch { return {ok:false,status:'FAIL',reason:'backup_checksum_failed',size:stat.size}; }
  if(expectedSha256!==null&&expectedSha256!==undefined&&String(expectedSha256).trim()!==''){
    const expected=String(expectedSha256).trim().toLowerCase();
    if(!/^[a-f0-9]{64}$/.test(expected))return {ok:false,status:'BLOCKED',reason:'expected_sha256_invalid',size:stat.size,sha256:actualSha256};
    if(actualSha256!==expected)return {ok:false,status:'FAIL',reason:'backup_checksum_mismatch',size:stat.size,sha256:actualSha256};
  }
  let db;
  try {
    db=new DatabaseSync(target,{readOnly:true});
    const rows=db.prepare('PRAGMA quick_check').all();
    const results=rows.map(row=>String(Object.values(row)[0]??''));
    if(!results.length||results.some(value=>value!=='ok'))return {ok:false,status:'FAIL',reason:'database_integrity_check_failed',size:stat.size,sha256:actualSha256,integrity:results.slice(0,10)};
    const violations=db.prepare('PRAGMA foreign_key_check').all();
    if(violations.length)return {ok:false,status:'FAIL',reason:'database_foreign_key_violations',size:stat.size,sha256:actualSha256,foreignKeyViolations:violations.length};
    return {ok:true,status:'PASS',reason:'backup_integrity_verified',size:stat.size,sha256:actualSha256,integrity:'ok',foreignKeyViolations:0,checkedAt:new Date().toISOString()};
  } catch {
    return {ok:false,status:'FAIL',reason:'backup_database_unreadable_or_invalid',size:stat.size,sha256:actualSha256};
  } finally {
    try { db?.close(); } catch {}
  }
}
