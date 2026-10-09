import test from 'node:test';
import assert from 'node:assert/strict';
import {Pool} from 'pg';
import {createPostgresDatabase,ensurePostgresMigrations} from '../src/db/postgres.js';

const connectionString=process.env.CODINGVIBES_TEST_POSTGRES_URL;

test('real PostgreSQL applies the complete schema, is idempotent, and rolls back failed transactions', {skip:!connectionString}, async()=>{
 const pool=new Pool({connectionString,max:2,connectionTimeoutMillis:5000,ssl:false});
 const db=createPostgresDatabase({pool});
 try{
  const first=await ensurePostgresMigrations(db);
  assert.deepEqual(first.applied,['0001_scaleout','0002_core_persistence','0003_application_tables']);
  const second=await ensurePostgresMigrations(db);
  assert.deepEqual(second.applied,[]);
  const tables=await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
  const names=new Set(tables.rows.map(row=>row.table_name));
  for(const table of ['codingvibes_schema_migrations','codingvibes_outbox','codingvibes_object_refs','codingvibes_audit_events','users','auth_sessions','projects','sessions','runs','messages','workspaces','workspace_members','workspace_invites','workspace_approvals','design_systems','project_domains','content_revisions','cloud_services','research_runs','changesets','tool_calls','evidence','run_events','runner_nodes','artifacts','agent_tasks','usage_events','repository_indexes','run_checkpoints','run_goals','billing_accounts','dependency_requests','media_jobs','project_content','provider_connections','deployments','oauth_states','auth_identities','google_auth_states','project_assets','visual_baselines','audit_logs','product_events','feature_flags','project_memory','ai_preferences','api_tokens','billing_events']){
   assert.ok(names.has(table),`missing PostgreSQL table: ${table}`);
  }
  const id='postgres-live-rollback-test';
  await assert.rejects(db.transaction(async client=>{
   await client.query('INSERT INTO users(id,email,password_hash,created_at) VALUES($1,$2,$3,$4)',[id,id+'@example.invalid','test-hash',new Date().toISOString()]);
   throw new Error('intentional_transaction_rollback');
  }),/intentional_transaction_rollback/);
  const user=await db.query('SELECT id FROM users WHERE id=$1',[id]);
  assert.equal(user.rowCount,0,'failed transaction must not persist partial writes');
 }finally{
  await db.close();
 }
});
