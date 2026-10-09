import test from 'node:test';
import assert from 'node:assert/strict';
import {createPostgresRepository} from '../src/db/postgres-repository.js';

function fakeDatabase(responses=[]){
 const calls=[];
 return {
  calls,
  async query(sql,params=[]){
   calls.push({sql:sql.replace(/\s+/g,' ').trim(),params});
   const response=responses.shift()||{rows:[],rowCount:0};
   return response;
  },
  async transaction(){}
 };
}

test('PostgreSQL repository normalizes email and keeps password hashes out of read results',async()=>{
 const db=fakeDatabase([{rows:[{id:'u1',email:'person@example.com',created_at:'2026-01-01T00:00:00.000Z'}],rowCount:1}]);
 const repository=createPostgresRepository(db);
 const user=await repository.getUserByEmail('  PERSON@Example.com ');
 assert.equal(user.id,'u1');
 assert.match(db.calls[0].sql,/SELECT id,email,created_at FROM users WHERE email=\$1/);
 assert.deepEqual(db.calls[0].params,['person@example.com']);
 assert.doesNotMatch(db.calls[0].sql,/password_hash/);
});

test('PostgreSQL auth-session reads enforce expiry in SQL',async()=>{
 const db=fakeDatabase([{rows:[],rowCount:0}]);
 const repository=createPostgresRepository(db);
 assert.equal(await repository.getAuthSession('session-1'),null);
 assert.match(db.calls[0].sql,/expires_at>\$2/);
 assert.deepEqual(db.calls[0].params[0],'session-1');
 assert.ok(Number.isFinite(Date.parse(db.calls[0].params[1])));
});

test('project and conversation reads are always owner scoped',async()=>{
 const db=fakeDatabase([{rows:[],rowCount:0},{rows:[],rowCount:0},{rows:[],rowCount:0}]);
 const repository=createPostgresRepository(db);
 assert.equal(await repository.getProject({userId:'user-a',projectId:'project-b'}),null);
 assert.equal(await repository.getSession({userId:'user-a',sessionId:'session-b'}),null);
 assert.deepEqual(await repository.listMessages({userId:'user-a',sessionId:'session-b'}),[]);
 assert.match(db.calls[0].sql,/WHERE id=\$1 AND user_id=\$2/);
 assert.deepEqual(db.calls[0].params,['project-b','user-a']);
 assert.match(db.calls[1].sql,/WHERE id=\$1 AND user_id=\$2/);
 assert.deepEqual(db.calls[1].params,['session-b','user-a']);
 assert.match(db.calls[2].sql,/JOIN sessions s ON s.id=m.session_id WHERE s.id=\$1 AND s.user_id=\$2/);
 assert.deepEqual(db.calls[2].params.slice(0,2),['session-b','user-a']);
});

test('collection limits are clamped before reaching PostgreSQL',async()=>{
 const db=fakeDatabase([{rows:[],rowCount:0},{rows:[],rowCount:0},{rows:[],rowCount:0}]);
 const repository=createPostgresRepository(db);
 await repository.listProjects({userId:'u1',limit:100000});
 await repository.listSessions({userId:'u1',projectId:'p1',limit:0});
 await repository.listMessages({userId:'u1',sessionId:'s1',limit:100000});
 assert.equal(db.calls[0].params.at(-1),100);
 assert.equal(db.calls[1].params.at(-1),1);
 assert.equal(db.calls[2].params.at(-1),500);
});

test('session and message creation encode ownership in INSERT SELECT statements',async()=>{
 const db=fakeDatabase([{rows:[{id:'s1'}],rowCount:1},{rows:[{id:'m1'}],rowCount:1}]);
 const repository=createPostgresRepository(db);
 await repository.createSession({userId:'u1',projectId:'p1',title:'  Draft  '});
 await repository.appendMessage({userId:'u1',sessionId:'s1',role:'user',content:'hello',metadata:{source:'test'}});
 assert.match(db.calls[0].sql,/FROM projects p WHERE p.id=\$3 AND p.user_id=\$2 RETURNING/);
 assert.equal(db.calls[0].params[3],'Draft');
 assert.match(db.calls[1].sql,/FROM sessions s WHERE s.id=\$2 AND s.user_id=\$7 RETURNING/);
 assert.equal(db.calls[1].params[4],JSON.stringify({source:'test'}));
});

test('repository rejects invalid database adapters and invalid writes',async()=>{
 assert.throws(()=>createPostgresRepository({query(){}}),/postgres_database_required/);
 const db=fakeDatabase();
 const repository=createPostgresRepository(db);
 await assert.rejects(repository.createUser({email:'person@example.com'}),/email_and_password_hash_required/);
 await assert.rejects(repository.createSession({userId:'u1',projectId:''}),/user_id_and_project_id_required/);
 await assert.rejects(repository.appendMessage({userId:'u1',sessionId:'s1',role:'admin',content:'x'}),/invalid_message_input/);
 assert.equal(db.calls.length,0);
});
