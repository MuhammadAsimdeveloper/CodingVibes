import process from 'node:process';
import {createPostgresDatabase,postgresConfigStatus} from '../src/db/postgres.js';
const status=postgresConfigStatus(process.env);
if(!status.configured){console.error(JSON.stringify({ok:false,...status},null,2));process.exit(2);}
const db=createPostgresDatabase({applicationName:'build-vibe-postgres-doctor'});
try{const health=await db.healthcheck();const result=await db.query('SELECT current_database() AS database, current_user AS user, current_schema() AS schema, version() AS version');console.log(JSON.stringify({ok:health,...status,server:result.rows[0]},null,2));if(!health)process.exitCode=3;}finally{await db.close();}
