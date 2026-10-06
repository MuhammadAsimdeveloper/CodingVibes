import {Pool} from 'pg';

const DEFAULT_MAX=Number(process.env.CODINGVIBES_PG_POOL_MAX||20);
const DEFAULT_TIMEOUT=Number(process.env.CODINGVIBES_PG_CONNECTION_TIMEOUT_MS||5000);
const DEFAULT_IDLE=Number(process.env.CODINGVIBES_PG_IDLE_TIMEOUT_MS||30000);

function connectionConfig(overrides={}){
  const url=String(overrides.connectionString||process.env.DATABASE_URL||'').trim();
  if(!url)throw new Error('DATABASE_URL is required for the PostgreSQL backend');
  const sslMode=String(overrides.sslMode||process.env.CODINGVIBES_PG_SSL_MODE||'require').toLowerCase();
  const ssl=sslMode==='disable'?false:{rejectUnauthorized:sslMode==='verify-full'};
  return {connectionString:url,max:Math.min(Math.max(Number(overrides.max||DEFAULT_MAX),1),100),connectionTimeoutMillis:Number(overrides.connectionTimeoutMillis||DEFAULT_TIMEOUT),idleTimeoutMillis:Number(overrides.idleTimeoutMillis||DEFAULT_IDLE),allowExitOnIdle:false,ssl,application_name:String(overrides.applicationName||'build-vibe')};
}

export function createPostgresDatabase(options={}){
  const pool=new Pool(connectionConfig(options));
  let closed=false;
  return {
    pool,
    async query(text,params){if(closed)throw new Error('postgres_database_closed');return pool.query(text,params);},
    async healthcheck(){if(closed)return false;try{const r=await pool.query('SELECT 1 AS ok');return r.rows[0]?.ok===1;}catch{return false;}},
    async transaction(fn){if(closed)throw new Error('postgres_database_closed');const client=await pool.connect();try{await client.query('BEGIN');const result=await fn(client);await client.query('COMMIT');return result;}catch(error){try{await client.query('ROLLBACK');}catch{}throw error;}finally{client.release();}},
    async close(){closed=true;await pool.end();}
  };
}

export async function ensurePostgresMigrations(db){
  await db.query('CREATE TABLE IF NOT EXISTS codingvibes_schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())');
  const migrations=[{version:'0001_scaleout',sql:migration0001()}];
  for(const migration of migrations){const existing=await db.query('SELECT version FROM codingvibes_schema_migrations WHERE version=$1',[migration.version]);if(existing.rowCount)continue;await db.transaction(async client=>{await client.query(migration.sql);await client.query('INSERT INTO codingvibes_schema_migrations(version) VALUES($1)',[migration.version]);});}
  return {applied:migrations.map(x=>x.version),schema:'codingvibes'};
}

export function postgresConfigStatus(env=process.env){
  const url=String(env.DATABASE_URL||'').trim();
  const backend=String(env.CODINGVIBES_DB_BACKEND||'sqlite').toLowerCase();
  return {backend,configured:backend==='sqlite'||Boolean(url),sslMode:String(env.CODINGVIBES_PG_SSL_MODE||'require'),poolMax:Number(env.CODINGVIBES_PG_POOL_MAX||DEFAULT_MAX),missing:backend==='postgres'&&!url?['DATABASE_URL']:[]};
}

function migration0001(){
  return [
    'CREATE TABLE IF NOT EXISTS codingvibes_outbox (id UUID PRIMARY KEY, topic TEXT NOT NULL, payload JSONB NOT NULL, status TEXT NOT NULL DEFAULT \'pending\', attempts INTEGER NOT NULL DEFAULT 0, available_at TIMESTAMPTZ NOT NULL DEFAULT now(), locked_at TIMESTAMPTZ, locked_by TEXT, last_error TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now())',
    'CREATE INDEX IF NOT EXISTS idx_codingvibes_outbox_ready ON codingvibes_outbox(status,available_at)',
    'CREATE TABLE IF NOT EXISTS codingvibes_object_refs (id UUID PRIMARY KEY, object_key TEXT UNIQUE NOT NULL, provider TEXT NOT NULL, bucket TEXT, size_bytes BIGINT NOT NULL, sha256 TEXT NOT NULL, content_type TEXT, metadata JSONB NOT NULL DEFAULT \'{}\'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now())',
    'CREATE TABLE IF NOT EXISTS codingvibes_audit_events (id UUID PRIMARY KEY, actor_user_id TEXT, action TEXT NOT NULL, resource_type TEXT NOT NULL, resource_id TEXT, metadata JSONB NOT NULL DEFAULT \'{}\'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now())',
    'CREATE INDEX IF NOT EXISTS idx_codingvibes_audit_events_created ON codingvibes_audit_events(created_at DESC)'
  ].join(';\n')+';';
}