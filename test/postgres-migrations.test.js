import test from 'node:test';
import assert from 'node:assert/strict';
import {ensurePostgresMigrations} from '../src/db/postgres.js';

function migrationHarness(){
 const versions=new Set();
 const statements=[];
 const client={
  async query(sql,params=[]){
   statements.push(sql);
   if(sql.startsWith('INSERT INTO codingvibes_schema_migrations'))versions.add(params[0]);
   return {rowCount:1,rows:[]};
  }
 };
 const db={
  async query(sql,params=[]){
   statements.push(sql);
   if(sql.startsWith('SELECT version FROM codingvibes_schema_migrations'))return {rowCount:versions.has(params[0])?1:0,rows:versions.has(params[0])?[{version:params[0]}]:[]};
   return {rowCount:1,rows:[]};
  },
  async transaction(fn){return fn(client);}
 };
 return {db,versions,statements};
}

test('PostgreSQL migrations create core auth, project, session, run and chat persistence tables',async()=>{
 const {db,versions,statements}=migrationHarness();
 const result=await ensurePostgresMigrations(db);
 assert.ok(versions.has('0001_scaleout'));
 assert.ok(versions.has('0002_core_persistence'));
 assert.ok(versions.has('0003_application_tables'));
 const sql=statements.join(' ');
 for(const table of ['users','auth_sessions','projects','sessions','runs','messages','workspaces','workspace_members','workspace_invites','workspace_approvals','design_systems','project_domains','content_revisions','cloud_services','research_runs','changesets','tool_calls','evidence','run_events','runner_nodes','artifacts','agent_tasks','usage_events','repository_indexes','run_checkpoints','run_goals','billing_accounts','dependency_requests','media_jobs','project_content','provider_connections','deployments','oauth_states','auth_identities','google_auth_states','project_assets','visual_baselines','audit_logs','product_events','feature_flags','project_memory','ai_preferences','api_tokens','billing_events']){
  assert.ok(sql.toLowerCase().includes('create table if not exists '+table+' (') || sql.toLowerCase().includes('create table if not exists '+table+'('),`migration must create ${table}`);
 }
 assert.ok(sql.includes('REFERENCES users(id) ON DELETE CASCADE'));
 assert.ok(sql.includes('REFERENCES projects(id) ON DELETE CASCADE'));
 assert.ok(sql.includes('idx_messages_session_created'));
 assert.ok(sql.includes('ALTER TABLE projects ADD COLUMN IF NOT EXISTS workspace_id TEXT'));
 assert.ok(sql.includes('estimated_cost_usd REAL'));
 assert.ok(sql.includes('idx_project_assets_project'));
 assert.equal(result.schema,'codingvibes');
});

test('PostgreSQL core migration is recorded once and skipped on subsequent startup',async()=>{
 const {db,versions,statements}=migrationHarness();
 await ensurePostgresMigrations(db);
 const firstCount=statements.filter(x=>x.startsWith('CREATE TABLE IF NOT EXISTS users')).length;
 await ensurePostgresMigrations(db);
 const secondCount=statements.filter(x=>x.startsWith('CREATE TABLE IF NOT EXISTS users')).length;
 assert.equal(firstCount,1);
 assert.equal(secondCount,1);
 assert.equal(versions.size,3);
});
