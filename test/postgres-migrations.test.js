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
 const sql=statements.join(' ');
 for(const table of ['users','auth_sessions','projects','sessions','runs','messages']){
  assert.ok(sql.toLowerCase().includes('create table if not exists '+table+' ('),`migration must create ${table}`);
 }
 assert.ok(sql.includes('REFERENCES users(id) ON DELETE CASCADE'));
 assert.ok(sql.includes('REFERENCES projects(id) ON DELETE CASCADE'));
 assert.ok(sql.includes('idx_messages_session_created'));
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
 assert.equal(versions.size,2);
});
