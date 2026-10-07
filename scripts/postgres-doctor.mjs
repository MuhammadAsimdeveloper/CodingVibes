import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
function loadLocalEnv(){
  for(const file of ['.env.postgres.local','.env.local']){
    const target=path.resolve(file);if(!fs.existsSync(target))continue;
    for(const raw of fs.readFileSync(target,'utf8').split(/\r?\n/)){
      const line=raw.trim();if(!line||line.startsWith('#'))continue;
      const i=line.indexOf('=');if(i<1)continue;const key=line.slice(0,i).trim();let value=line.slice(i+1).trim();if((value.startsWith('"')&&value.endsWith('"'))||(value.startsWith("'")&&value.endsWith("'")))value=value.slice(1,-1);if(!(key in process.env))process.env[key]=value;
    }
    if(process.env.DATABASE_URL)break;
  }
  if(!process.env.DATABASE_URL)process.env.DATABASE_URL='postgresql://buildvibe:buildvibe_dev_password@127.0.0.1:5432/buildvibe';
  if(!process.env.CODINGVIBES_DB_BACKEND)process.env.CODINGVIBES_DB_BACKEND='postgres';
  if(!process.env.CODINGVIBES_PG_SSL_MODE)process.env.CODINGVIBES_PG_SSL_MODE='disable';
}
loadLocalEnv();
import {createPostgresDatabase,postgresConfigStatus} from '../src/db/postgres.js';
const status=postgresConfigStatus(process.env);
if(!status.configured){console.error(JSON.stringify({ok:false,...status},null,2));process.exit(2);}
const db=createPostgresDatabase({applicationName:'build-vibe-postgres-doctor'});
try{const health=await db.healthcheck();const result=await db.query('SELECT current_database() AS database, current_user AS user, current_schema() AS schema, version() AS version');console.log(JSON.stringify({ok:health,...status,server:result.rows[0]},null,2));if(!health)process.exitCode=3;}finally{await db.close();}
