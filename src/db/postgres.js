import {Pool} from 'pg';

const DEFAULT_MAX=Number(process.env.CODINGVIBES_PG_POOL_MAX||20);
const DEFAULT_TIMEOUT=Number(process.env.CODINGVIBES_PG_CONNECTION_TIMEOUT_MS||5000);
const DEFAULT_IDLE=Number(process.env.CODINGVIBES_PG_IDLE_TIMEOUT_MS||30000);

function connectionConfig(overrides={}){
  const url=String(overrides.connectionString||process.env.DATABASE_URL||'').trim();
  if(!url)throw new Error('DATABASE_URL is required for the PostgreSQL backend');
  const sslMode=String(overrides.sslMode||process.env.CODINGVIBES_PG_SSL_MODE||'require').trim().toLowerCase();
  if(!['disable','require','verify-full'].includes(sslMode))throw new Error('invalid_postgres_ssl_mode: use disable, require, or verify-full');
  const ssl=sslMode==='disable'?false:{rejectUnauthorized:sslMode==='verify-full'};
  return {connectionString:url,max:Math.min(Math.max(Number(overrides.max||DEFAULT_MAX),1),100),connectionTimeoutMillis:Number(overrides.connectionTimeoutMillis||DEFAULT_TIMEOUT),idleTimeoutMillis:Number(overrides.idleTimeoutMillis||DEFAULT_IDLE),allowExitOnIdle:false,ssl,application_name:String(overrides.applicationName||'build-vibe')};
}

export function createPostgresDatabase(options={}){
  const pool=options.pool||new Pool(connectionConfig(options));
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
  const migrations=[
    {version:'0001_scaleout',sql:migration0001()},
    {version:'0002_core_persistence',sql:migration0002Core()},
    {version:'0003_application_tables',sql:migration0003ApplicationTables()}
  ];
  const applied=[];
  for(const migration of migrations){
    const wasApplied=await db.transaction(async client=>{
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))',['codingvibes:migration:'+migration.version]);
      const existing=await client.query('SELECT version FROM codingvibes_schema_migrations WHERE version=$1',[migration.version]);
      if(existing.rowCount)return false;
      await client.query(migration.sql);
      await client.query('INSERT INTO codingvibes_schema_migrations(version) VALUES($1)',[migration.version]);
      return true;
    });
    if(wasApplied)applied.push(migration.version);
  }
  return {applied,schema:'codingvibes'};
}

export function postgresConfigStatus(env=process.env){
  const url=String(env.DATABASE_URL||'').trim();
  const backend=String(env.CODINGVIBES_DB_BACKEND||'sqlite').toLowerCase();
  return {backend,configured:backend==='postgres'&&Boolean(url),sslMode:String(env.CODINGVIBES_PG_SSL_MODE||'require'),poolMax:Number(env.CODINGVIBES_PG_POOL_MAX||DEFAULT_MAX),missing:backend==='postgres'&&!url?['DATABASE_URL']:[]};
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

function migration0003ApplicationTables(){
  return [
    "CREATE TABLE IF NOT EXISTS workspaces(id TEXT PRIMARY KEY,owner_user_id TEXT NOT NULL,name TEXT NOT NULL,slug TEXT UNIQUE NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE CASCADE)",
    "CREATE TABLE IF NOT EXISTS workspace_members(id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL,user_id TEXT NOT NULL,role TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'active',created_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(workspace_id,user_id),FOREIGN KEY(workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)",
    "CREATE TABLE IF NOT EXISTS workspace_invites(id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL,email TEXT NOT NULL,role TEXT NOT NULL,token_hash TEXT NOT NULL UNIQUE,invited_by TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',expires_at TEXT NOT NULL,created_at TEXT NOT NULL,accepted_at TEXT,FOREIGN KEY(workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,FOREIGN KEY(invited_by) REFERENCES users(id) ON DELETE CASCADE)",
    "CREATE TABLE IF NOT EXISTS workspace_approvals(id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL,project_id TEXT NOT NULL,run_id TEXT,kind TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',requested_by TEXT NOT NULL,approved_by TEXT,comment TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,FOREIGN KEY(workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,FOREIGN KEY(requested_by) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(approved_by) REFERENCES users(id) ON DELETE SET NULL)",
    "CREATE TABLE IF NOT EXISTS design_systems(project_id TEXT PRIMARY KEY,user_id TEXT NOT NULL,name TEXT NOT NULL,system_json TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)",
    "CREATE TABLE IF NOT EXISTS project_domains(id TEXT PRIMARY KEY,project_id TEXT NOT NULL,user_id TEXT NOT NULL,domain TEXT NOT NULL,provider TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',verification_json TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(project_id,domain),FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)",
    "CREATE TABLE IF NOT EXISTS content_revisions(id TEXT PRIMARY KEY,project_id TEXT NOT NULL,user_id TEXT NOT NULL,version INTEGER NOT NULL,content_json TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'draft',published_at TEXT,created_at TEXT NOT NULL,FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)",
    "CREATE TABLE IF NOT EXISTS cloud_services(id TEXT PRIMARY KEY,project_id TEXT NOT NULL,user_id TEXT NOT NULL,type TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'requested',provider TEXT,config_json TEXT,error TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(project_id,type),FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)",
    "CREATE TABLE IF NOT EXISTS research_runs(id TEXT PRIMARY KEY,project_id TEXT NOT NULL,user_id TEXT NOT NULL,query TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'completed',provider TEXT,results_json TEXT NOT NULL,created_at TEXT NOT NULL,FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)",
    "CREATE TABLE IF NOT EXISTS changesets(id TEXT PRIMARY KEY,run_id TEXT NOT NULL,status TEXT NOT NULL,summary TEXT,operations_json TEXT,commit_sha TEXT,created_at TEXT NOT NULL,FOREIGN KEY(run_id) REFERENCES runs(id) ON DELETE CASCADE)",
    "CREATE TABLE IF NOT EXISTS tool_calls(id TEXT PRIMARY KEY,run_id TEXT,tool TEXT NOT NULL,permission TEXT NOT NULL,input_json TEXT,before_json TEXT,after_json TEXT,result_json TEXT,created_at TEXT NOT NULL)",
    "CREATE TABLE IF NOT EXISTS evidence(id TEXT PRIMARY KEY,run_id TEXT NOT NULL,type TEXT NOT NULL,payload_json TEXT,created_at TEXT NOT NULL,FOREIGN KEY(run_id) REFERENCES runs(id) ON DELETE CASCADE)",
    "CREATE TABLE IF NOT EXISTS run_events(id TEXT PRIMARY KEY,run_id TEXT NOT NULL,type TEXT NOT NULL,payload_json TEXT,created_at TEXT NOT NULL,FOREIGN KEY(run_id) REFERENCES runs(id) ON DELETE CASCADE)",
    "CREATE TABLE IF NOT EXISTS runner_nodes(id TEXT PRIMARY KEY,name TEXT NOT NULL,capability TEXT NOT NULL,labels_json TEXT,metadata_json TEXT,status TEXT NOT NULL,last_heartbeat TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL)",
    "CREATE TABLE IF NOT EXISTS artifacts(id TEXT PRIMARY KEY,run_id TEXT NOT NULL,type TEXT NOT NULL,path TEXT NOT NULL,size INTEGER NOT NULL,sha256 TEXT NOT NULL,stored_path TEXT,url TEXT,created_at TEXT NOT NULL,FOREIGN KEY(run_id) REFERENCES runs(id) ON DELETE CASCADE)",
    "CREATE TABLE IF NOT EXISTS agent_tasks(id TEXT PRIMARY KEY,run_id TEXT NOT NULL,key TEXT NOT NULL,title TEXT NOT NULL,phase TEXT NOT NULL,status TEXT NOT NULL,dependencies_json TEXT,metadata_json TEXT,started_at TEXT,finished_at TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(run_id,key),FOREIGN KEY(run_id) REFERENCES runs(id) ON DELETE CASCADE)",
    "CREATE TABLE IF NOT EXISTS usage_events(id TEXT PRIMARY KEY,run_id TEXT,user_id TEXT NOT NULL,provider TEXT,model TEXT,tier TEXT,input_tokens INTEGER DEFAULT 0,output_tokens INTEGER DEFAULT 0,tool_calls INTEGER DEFAULT 0,duration_ms INTEGER DEFAULT 0,created_at TEXT NOT NULL,FOREIGN KEY(run_id) REFERENCES runs(id) ON DELETE CASCADE)",
    "CREATE TABLE IF NOT EXISTS repository_indexes(run_id TEXT PRIMARY KEY,index_json TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,FOREIGN KEY(run_id) REFERENCES runs(id) ON DELETE CASCADE)",
    "CREATE TABLE IF NOT EXISTS run_checkpoints(id TEXT PRIMARY KEY,run_id TEXT NOT NULL,name TEXT NOT NULL,path TEXT NOT NULL,metadata_json TEXT,created_at TEXT NOT NULL,FOREIGN KEY(run_id) REFERENCES runs(id) ON DELETE CASCADE)",
    "CREATE TABLE IF NOT EXISTS run_goals(id TEXT PRIMARY KEY,run_id TEXT UNIQUE NOT NULL,objective TEXT NOT NULL,completion_criteria_json TEXT,constraints_json TEXT,status TEXT NOT NULL,metadata_json TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,FOREIGN KEY(run_id) REFERENCES runs(id) ON DELETE CASCADE)",
    "CREATE TABLE IF NOT EXISTS billing_accounts(user_id TEXT PRIMARY KEY,plan TEXT NOT NULL DEFAULT 'free',status TEXT NOT NULL DEFAULT 'active',stripe_customer_id TEXT,stripe_subscription_id TEXT,current_period_end TEXT,cancel_at_period_end INTEGER DEFAULT 0,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)",
    "CREATE TABLE IF NOT EXISTS dependency_requests(id TEXT PRIMARY KEY,run_id TEXT NOT NULL,dependencies_json TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',approved_at TEXT,approved_by TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,FOREIGN KEY(run_id) REFERENCES runs(id) ON DELETE CASCADE)",
    "CREATE TABLE IF NOT EXISTS media_jobs(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,status TEXT NOT NULL,prompt TEXT NOT NULL,model TEXT NOT NULL,ratio TEXT NOT NULL,duration INTEGER NOT NULL,runway_task_id TEXT,source_url TEXT,stored_path TEXT,size INTEGER DEFAULT 0,error TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)",
    "CREATE TABLE IF NOT EXISTS project_content(project_id TEXT PRIMARY KEY,user_id TEXT NOT NULL,content_json TEXT NOT NULL,updated_at TEXT NOT NULL,FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)",
    "CREATE TABLE IF NOT EXISTS provider_connections(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,provider TEXT NOT NULL,secret_ciphertext TEXT NOT NULL,metadata_json TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(user_id,provider),FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)",
    "CREATE TABLE IF NOT EXISTS deployments(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,project_id TEXT NOT NULL,provider TEXT NOT NULL,status TEXT NOT NULL,deployment_id TEXT,url TEXT,branch TEXT,commit_sha TEXT,error TEXT,metadata_json TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE)",
    "CREATE TABLE IF NOT EXISTS oauth_states(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,provider TEXT NOT NULL,state TEXT NOT NULL,expires_at TEXT NOT NULL,metadata_json TEXT,created_at TEXT NOT NULL,UNIQUE(provider,state),FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)",
    "CREATE TABLE IF NOT EXISTS auth_identities(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,provider TEXT NOT NULL,subject TEXT NOT NULL,email TEXT NOT NULL,metadata_json TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(provider,subject),FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)",
    "CREATE TABLE IF NOT EXISTS google_auth_states(id TEXT PRIMARY KEY,state TEXT NOT NULL UNIQUE,expires_at TEXT NOT NULL,metadata_json TEXT,created_at TEXT NOT NULL)",
    "CREATE TABLE IF NOT EXISTS project_assets(id TEXT PRIMARY KEY,project_id TEXT NOT NULL,user_id TEXT NOT NULL,name TEXT NOT NULL,mime TEXT NOT NULL,kind TEXT NOT NULL,role TEXT NOT NULL,size INTEGER NOT NULL,sha256 TEXT NOT NULL,public_path TEXT NOT NULL,metadata_json TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)",
    "CREATE TABLE IF NOT EXISTS visual_baselines(id TEXT PRIMARY KEY,project_id TEXT NOT NULL,user_id TEXT NOT NULL,route TEXT NOT NULL,stored_path TEXT NOT NULL,size INTEGER NOT NULL,sha256 TEXT NOT NULL,width INTEGER,height INTEGER,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(project_id,route),FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)",
    "CREATE TABLE IF NOT EXISTS audit_logs(id TEXT PRIMARY KEY,actor_user_id TEXT,action TEXT NOT NULL,resource_type TEXT NOT NULL,resource_id TEXT,metadata_json TEXT,created_at TEXT NOT NULL,FOREIGN KEY(actor_user_id) REFERENCES users(id) ON DELETE SET NULL)",
    "CREATE TABLE IF NOT EXISTS product_events(id TEXT PRIMARY KEY,user_id TEXT,project_id TEXT,session_id TEXT,event TEXT NOT NULL,properties_json TEXT NOT NULL,created_at TEXT NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL,FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE SET NULL,FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE SET NULL)",
    "CREATE TABLE IF NOT EXISTS feature_flags(key TEXT PRIMARY KEY,enabled INTEGER NOT NULL DEFAULT 1,rollout_percentage REAL NOT NULL DEFAULT 100,environments_json TEXT NOT NULL,kill_switch INTEGER NOT NULL DEFAULT 0,config_json TEXT NOT NULL,updated_by TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,FOREIGN KEY(updated_by) REFERENCES users(id) ON DELETE SET NULL)",
    "CREATE TABLE IF NOT EXISTS project_memory(project_id TEXT PRIMARY KEY,user_id TEXT NOT NULL,memory_json TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1,updated_at TEXT NOT NULL,FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)",
    "CREATE TABLE IF NOT EXISTS ai_preferences(user_id TEXT PRIMARY KEY,primary_provider TEXT NOT NULL,chain_json TEXT NOT NULL,default_models_json TEXT,updated_at TEXT NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)",
    "CREATE TABLE IF NOT EXISTS api_tokens(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,name TEXT NOT NULL,token_hash TEXT NOT NULL UNIQUE,token_prefix TEXT NOT NULL,created_at TEXT NOT NULL,last_used_at TEXT,revoked_at TEXT,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)",
    "ALTER TABLE projects ADD COLUMN IF NOT EXISTS workspace_id TEXT",
    "ALTER TABLE billing_accounts ADD COLUMN IF NOT EXISTS video_trial_used INTEGER DEFAULT 0",
    "ALTER TABLE billing_accounts ADD COLUMN IF NOT EXISTS billing_provider TEXT NOT NULL DEFAULT 'stripe'",
    "ALTER TABLE billing_accounts ADD COLUMN IF NOT EXISTS provider_customer_id TEXT",
    "ALTER TABLE billing_accounts ADD COLUMN IF NOT EXISTS provider_subscription_id TEXT",
    "ALTER TABLE billing_accounts ADD COLUMN IF NOT EXISTS provider_transaction_id TEXT",
    "ALTER TABLE usage_events ADD COLUMN IF NOT EXISTS estimated_cost_usd REAL",
    "CREATE TABLE IF NOT EXISTS billing_events (id TEXT PRIMARY KEY, event_type TEXT NOT NULL, payload_hash TEXT NOT NULL, received_at TEXT NOT NULL)",
    "CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_product_events_user ON product_events(user_id,created_at)",
    "CREATE INDEX IF NOT EXISTS idx_product_events_project ON product_events(project_id,created_at)",
    "CREATE INDEX IF NOT EXISTS idx_product_events_event ON product_events(event,created_at)",
    "CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id,status)",
    "CREATE INDEX IF NOT EXISTS idx_workspace_invites_email ON workspace_invites(email,status,expires_at)",
    "CREATE INDEX IF NOT EXISTS idx_workspace_approvals_project ON workspace_approvals(project_id,status)",
    "CREATE INDEX IF NOT EXISTS idx_project_domains_project ON project_domains(project_id,status)",
    "CREATE INDEX IF NOT EXISTS idx_content_revisions_project ON content_revisions(project_id,version)",
    "CREATE INDEX IF NOT EXISTS idx_cloud_services_project ON cloud_services(project_id)",
    "CREATE INDEX IF NOT EXISTS idx_research_runs_project ON research_runs(project_id,created_at)",
    "CREATE INDEX IF NOT EXISTS idx_provider_connections_user ON provider_connections(user_id,provider)",
    "CREATE INDEX IF NOT EXISTS idx_deployments_project ON deployments(project_id,created_at)",
    "CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(provider,state,expires_at)",
    "CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_id)",
    "CREATE INDEX IF NOT EXISTS idx_run_goals_run ON run_goals(run_id)",
    "CREATE INDEX IF NOT EXISTS idx_runs_session ON runs(session_id)",
    "CREATE INDEX IF NOT EXISTS idx_project_content_user ON project_content(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_project_assets_project ON project_assets(project_id,created_at)",
    "CREATE INDEX IF NOT EXISTS idx_visual_baselines_project ON visual_baselines(project_id,route)",
    "CREATE INDEX IF NOT EXISTS idx_agent_tasks_run ON agent_tasks(run_id,status)",
    "CREATE INDEX IF NOT EXISTS idx_evidence_run ON evidence(run_id)",
    "CREATE INDEX IF NOT EXISTS idx_events_run ON run_events(run_id)",
    "CREATE INDEX IF NOT EXISTS idx_runner_nodes_capability ON runner_nodes(capability)",
    "CREATE INDEX IF NOT EXISTS idx_artifacts_run ON artifacts(run_id)",
    "CREATE INDEX IF NOT EXISTS idx_api_tokens_user ON api_tokens(user_id,created_at)",
    "CREATE INDEX IF NOT EXISTS idx_ai_preferences_user ON ai_preferences(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_projects_workspace ON projects(workspace_id)"
  ].join(';\n')+';';
}

function migration0002Core(){
  return [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS auth_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,
    'CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_expiry ON auth_sessions(user_id,expires_at)',
    `CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      repo_path TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    'CREATE INDEX IF NOT EXISTS idx_projects_user_updated ON projects(user_id,updated_at DESC)',
    `CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    'CREATE INDEX IF NOT EXISTS idx_sessions_project_updated ON sessions(project_id,user_id,updated_at DESC)',
    `CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      request TEXT NOT NULL,
      target_id TEXT,
      spec_json TEXT,
      workspace TEXT,
      preview_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    'CREATE INDEX IF NOT EXISTS idx_runs_session_created ON runs(session_id,created_at DESC)',
    `CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata_json TEXT,
      created_at TEXT NOT NULL
    )`,
    'CREATE INDEX IF NOT EXISTS idx_messages_session_created ON messages(session_id,created_at)'
  ].join(';\n')+';';
}
