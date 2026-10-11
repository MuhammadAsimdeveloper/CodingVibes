import {verifyBackup} from '../src/ops/backup.js';

const file=String(process.env.CODINGVIBES_BACKUP_FILE||'').trim();
const expectedSha256=String(process.env.CODINGVIBES_BACKUP_SHA256||'').trim()||null;
const result=verifyBackup(file,{expectedSha256});
console.log(JSON.stringify(result,null,2));
if(!result.ok){
  console.error('Backup verification failed. Do not restore or promote this file.');
  process.exitCode=2;
}
