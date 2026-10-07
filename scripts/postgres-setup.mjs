import {createPostgresDatabase,ensurePostgresMigrations,postgresConfigStatus} from '../src/db/postgres.js';

const status=postgresConfigStatus();
if(!status.configured){
  console.error(JSON.stringify({ok:false,error:'postgres_not_configured',status},null,2));
  process.exit(1);
}
const db=createPostgresDatabase();
try{
  if(!(await db.healthcheck())){
    console.error(JSON.stringify({ok:false,error:'postgres_unhealthy',status},null,2));
    process.exit(1);
  }
  const migration=await ensurePostgresMigrations(db);
  const result=await db.query('SELECT current_database() AS database, current_user AS user');
  console.log(JSON.stringify({ok:true,backend:status.backend,sslMode:status.sslMode,database:result.rows[0]?.database||null,user:result.rows[0]?.user||null,schema:migration.schema,migrations:migration.applied},null,2));
}finally{await db.close();}
