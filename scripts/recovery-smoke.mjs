import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {Store} from '../src/db/store.js';
import {backupStore} from '../src/ops/backup.js';

const root=fs.mkdtempSync(path.join(os.tmpdir(),'build-vibe-recovery-'));
let store=null,restored=null;
try{
  const dbPath=path.join(root,'live.sqlite'),backupRoot=path.join(root,'backups'),restorePath=path.join(root,'restore.sqlite');
  store=new Store(dbPath);
  const user=store.createUser('recovery@example.com','hash');
  const project=store.createProject(user.id,{name:'Recovery Fixture'});
  const backup=backupStore(store,backupRoot);
  fs.copyFileSync(backup.path,restorePath);
  restored=new Store(restorePath);
  const recovered=restored.getProject(project.id,user.id);
  const ok=Boolean(recovered&&restored.healthcheck());
  console.log(JSON.stringify({status:ok?'PASS':'FAIL',backupSha256:backup.sha256,backupBytes:backup.size,recoveredProject:Boolean(recovered)},null,2));
  if(!ok)process.exitCode=1;
}catch(error){
  console.error(JSON.stringify({status:'FAIL',error:String(error?.message||error)},null,2));
  process.exitCode=1;
}finally{
  restored?.close();store?.close();fs.rmSync(root,{recursive:true,force:true});
}
