import test from 'node:test';import assert from 'node:assert/strict';import {postgresConfigStatus,connectionConfigForLocalDev} from '../src/db/postgres.js';
test('postgres local development config can be resolved from DATABASE_URL or defaults',()=>{
 const c=connectionConfigForLocalDev({DATABASE_URL:'postgresql://buildvibe:buildvibe@127.0.0.1:54329/buildvibe',CODINGVIBES_PG_SSL_MODE:'disable'});
 assert.equal(c.connectionString.includes('127.0.0.1:54329'),true);assert.equal(c.ssl,false);
});
test('postgres status identifies a ready local configuration without requiring TLS',()=>{
 const s=postgresConfigStatus({DATABASE_URL:'postgresql://x:y@127.0.0.1:54329/buildvibe',CODINGVIBES_DB_BACKEND:'postgres',CODINGVIBES_PG_SSL_MODE:'disable'});
 assert.equal(s.configured,true);assert.equal(s.missing.length,0);assert.equal(s.localDev,true);
});
