import test from 'node:test';import assert from 'node:assert/strict';import {postgresConfigStatus} from '../src/db/postgres.js';
test('postgres configuration stays explicit and local-friendly',()=>{
 const x=postgresConfigStatus({CODINGVIBES_DB_BACKEND:'postgres',DATABASE_URL:'postgresql://localhost:5432/buildvibe',CODINGVIBES_PG_SSL_MODE:'disable'});
 assert.equal(x.configured,true);assert.equal(x.backend,'postgres');assert.equal(x.sslMode,'disable');
});
test('postgres setup reports missing DATABASE_URL',()=>{
 const x=postgresConfigStatus({CODINGVIBES_DB_BACKEND:'postgres',DATABASE_URL:''});assert.equal(x.configured,false);assert.deepEqual(x.missing,['DATABASE_URL']);
});
import {connectionConfigForLocalDev} from '../src/db/postgres.js';

test('local PostgreSQL helper defaults match the Docker compose profile',()=>{
  const x=connectionConfigForLocalDev({DATABASE_URL:'',CODINGVIBES_PG_SSL_MODE:'disable'});
  assert.equal(x.connectionString,'postgresql://buildvibe:buildvibe_dev_password@127.0.0.1:5432/buildvibe');
});
