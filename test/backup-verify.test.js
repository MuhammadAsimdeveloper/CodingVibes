import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {Store} from '../src/db/store.js';
import {backupStore,verifyBackup} from '../src/ops/backup.js';

test('backup verifier confirms SQLite integrity, foreign keys and the expected SHA-256',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'build-vibe-backup-verify-'));
  let store;
  try{
    store=new Store(path.join(root,'live.sqlite'));
    const user=store.createUser('backup-check@example.com','hash');
    const project=store.createProject(user.id,{name:'Backup integrity fixture'});
    const backup=backupStore(store,path.join(root,'backups'));
    const result=verifyBackup(backup.path,{expectedSha256:backup.sha256});
    assert.equal(result.ok,true);
    assert.equal(result.status,'PASS');
    assert.equal(result.integrity,'ok');
    assert.equal(result.foreignKeyViolations,0);
    assert.equal(result.sha256,backup.sha256);
    assert.ok(result.size>0);
    assert.equal(verifyBackup(backup.path,{expectedSha256:'0'.repeat(64)}).reason,'backup_checksum_mismatch');
    assert.equal(verifyBackup(backup.path,{expectedSha256:'not-a-sha'}).reason,'expected_sha256_invalid');
    assert.ok(project.id);
  }finally{
    store?.close();
    fs.rmSync(root,{recursive:true,force:true});
  }
});

test('backup verifier rejects missing, symlink and corrupt database paths safely',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'build-vibe-backup-invalid-'));
  try{
    const missing=verifyBackup(path.join(root,'missing.sqlite'));
    assert.equal(missing.status,'BLOCKED');
    assert.equal(missing.reason,'backup_file_unavailable');
    const corrupt=path.join(root,'corrupt.sqlite');
    fs.writeFileSync(corrupt,'not a sqlite database');
    assert.equal(verifyBackup(corrupt).status,'FAIL');
    assert.equal(verifyBackup(corrupt).reason,'backup_database_unreadable_or_invalid');
    const link=path.join(root,'backup-link.sqlite');
    fs.symlinkSync(corrupt,link);
    assert.equal(verifyBackup(link).status,'BLOCKED');
    assert.equal(verifyBackup(link).reason,'backup_path_must_be_regular_file');
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
