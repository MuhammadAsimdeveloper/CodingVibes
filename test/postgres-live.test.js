import test from 'node:test';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {Pool} from 'pg';
import {createPostgresDatabase,ensurePostgresMigrations} from '../src/db/postgres.js';
import {createPostgresRepository} from '../src/db/postgres-repository.js';

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
  const repository=createPostgresRepository(db);
  const suffix=randomUUID();
  const user=await repository.createUser({email:'postgres-live-'+suffix+'@example.invalid',passwordHash:'integration-test-hash'});
  assert.equal((await repository.getUserByEmail(user.email)).id,user.id);
  assert.equal((await repository.getUserById(user.id)).email,user.email);
  const authSession=await repository.createAuthSession({userId:user.id});
  assert.equal((await repository.getAuthSession(authSession.id)).user_id,user.id);
  const expiredSession=await repository.createAuthSession({userId:user.id,expiresAt:'2000-01-01T00:00:00.000Z'});
  assert.equal(await repository.getAuthSession(expiredSession.id),null,'expired auth sessions must not authenticate');
  assert.equal(await repository.deleteAuthSession(authSession.id),true);
  assert.equal(await repository.getAuthSession(authSession.id),null,'deleted auth sessions must not authenticate');
  const project=await repository.createProject({userId:user.id,name:'Integration project',slug:'postgres-live-'+suffix});
  assert.equal((await repository.listProjects({userId:user.id}))[0].id,project.id);
  assert.equal((await repository.getProject({userId:user.id,projectId:project.id})).id,project.id);
  assert.equal(await repository.getProject({userId:'not-the-owner',projectId:project.id}),null,'project lookup must enforce ownership');
  const session=await repository.createSession({userId:user.id,projectId:project.id,title:'Integration conversation'});
  assert.equal((await repository.getSession({userId:user.id,sessionId:session.id})).id,session.id);
  assert.equal(await repository.getSession({userId:'not-the-owner',sessionId:session.id}),null,'session lookup must enforce ownership');
  assert.equal((await repository.listSessions({userId:user.id,projectId:project.id}))[0].id,session.id);
  assert.deepEqual(await repository.listSessions({userId:'not-the-owner',projectId:project.id}),[]);
  const message=await repository.appendMessage({userId:user.id,sessionId:session.id,role:'user',content:'Build a responsive landing page',metadata:{source:'integration-test'}});
  assert.equal(message.session_id,session.id);
  assert.equal(JSON.parse(message.metadata_json).source,'integration-test');
  assert.equal((await repository.listMessages({userId:user.id,sessionId:session.id})).length,1);
  await assert.rejects(repository.createSession({userId:'not-the-owner',projectId:project.id}),/project_not_found_or_forbidden/);
  assert.deepEqual(await repository.listMessages({userId:'not-the-owner',sessionId:session.id}),[]);
  const id='postgres-live-rollback-test';
  await assert.rejects(db.transaction(async client=>{
   await client.query('INSERT INTO users(id,email,password_hash,created_at) VALUES($1,$2,$3,$4)',[id,id+'@example.invalid','test-hash',new Date().toISOString()]);
   throw new Error('intentional_transaction_rollback');
  }),/intentional_transaction_rollback/);
  const rolledBackUser=await db.query('SELECT id FROM users WHERE id=$1',[id]);
  assert.equal(rolledBackUser.rowCount,0,'failed transaction must not persist partial writes');
 }finally{
  await db.close();
 }
});
