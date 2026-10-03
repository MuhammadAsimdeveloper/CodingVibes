import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

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
