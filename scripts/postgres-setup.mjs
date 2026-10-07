import process from 'node:process';
import {createPostgresDatabase,ensurePostgresMigrations,postgresConfigStatus} from '../src/db/postgres.js';

const status=postgresConfigStatus(process.env);
if(!status.configured){console.error(JSON.stringify({ok:false,...status},null,2));process.exit(2);}
const db=createPostgresDatabase({applicationName:'build-vibe-postgres-setup'});
try{const migration=await ensurePostgresMigrations(db);const health=await db.healthcheck();console.log(JSON.stringify({ok:health,backend:'postgres',database:'buildvibe',migration,connectionHint:'Use DATABASE_URL from your .env.postgres.local or environment.'},null,2));if(!health)process.exitCode=3;}finally{await db.close();}
