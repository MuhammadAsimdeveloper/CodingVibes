import test from 'node:test';
import assert from 'node:assert/strict';
import {getToolContract, listToolContracts, runTool} from '../src/tool-fabric/index.js';

const EXPECTED_TOOLS = [
  'dev.hash.generate',
  'security.checksum.verify',
  'dev.uuid.generate',
  'dev.url.encode',
  'dev.timestamp.convert',
  'dev.cron.inspect',
];

test('local hash, checksum, UUID and URL tools expose canonical no-network contracts', () => {
  for (const id of EXPECTED_TOOLS) {
    const contract = getToolContract(id);
    assert.ok(contract, 'missing contract: ' + id);
    assert.equal(contract.executionMode, 'local');
    assert.equal(contract.networkRequired, false);
    assert.equal(contract.authRequired, false);
    assert.equal(contract.status, 'READY');
    assert.equal(contract.inputSchema.type, 'object');
    assert.ok(contract.auditEvent);
    assert.ok(contract.provenance);
  }
  assert.equal(listToolContracts().length, 56);
  assert.equal(listToolContracts({category:'Developer'}).filter(x => x.id.startsWith('dev.')).length, 5);
  assert.equal(listToolContracts({category:'Security'}).filter(x => x.id === 'security.checksum.verify').length, 1);
});

test('hash generation produces standard known digests and supports explicit output encodings', async () => {
  const sha256 = await runTool('dev.hash.generate', {text:'abc',algorithm:'sha256'});
  assert.equal(sha256.status, 'COMPLETED');
  assert.equal(sha256.output.digest, 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(sha256.output.algorithm, 'sha256');
  assert.equal(sha256.output.encoding, 'hex');
  assert.equal(sha256.provenance.networkUsed, false);
  assert.ok(sha256.warnings.some(w => /password/i.test(w)));

  const base64 = await runTool('dev.hash.generate', {text:'abc',algorithm:'sha256',encoding:'base64'});
  assert.equal(base64.status, 'COMPLETED');
  assert.equal(base64.output.digest, 'ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=');
  assert.equal(base64.output.encoding, 'base64');

  const sha512 = await runTool('dev.hash.generate', {text:'',algorithm:'sha512'});
  assert.equal(sha512.status, 'COMPLETED');
  assert.equal(sha512.output.digest.length, 128);
});

test('checksum verification validates encoding/length and uses fixed-size digest comparison', async () => {
  const expected = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
  const match = await runTool('security.checksum.verify', {text:'abc',expected,algorithm:'sha256',encoding:'hex'});
  assert.equal(match.status, 'COMPLETED');
  assert.equal(match.output.matches, true);
  assert.equal(match.output.algorithm, 'sha256');

  const mismatch = await runTool('security.checksum.verify', {text:'abd',expected,algorithm:'sha256',encoding:'hex'});
  assert.equal(mismatch.status, 'COMPLETED');
  assert.equal(mismatch.output.matches, false);

  const base64 = await runTool('security.checksum.verify', {
    text:'abc', expected:'ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=', algorithm:'sha256', encoding:'base64'
  });
  assert.equal(base64.status, 'COMPLETED');
  assert.equal(base64.output.matches, true);

  assert.equal((await runTool('security.checksum.verify',{text:'abc',expected:'1234'})).status,'INVALID_INPUT');
  assert.equal((await runTool('security.checksum.verify',{text:'abc',expected:'zz'.repeat(32),encoding:'hex'})).status,'INVALID_INPUT');
});

test('UUID generation returns version-4 UUIDs and URL utilities round-trip reserved and Unicode text', async () => {
  const uuidA = await runTool('dev.uuid.generate', {});
  const uuidB = await runTool('dev.uuid.generate', {});
  assert.equal(uuidA.status, 'COMPLETED');
  assert.match(uuidA.output.uuid, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.notEqual(uuidA.output.uuid, uuidB.output.uuid);

  const source = 'hello world/雪 & ?';
  const encoded = await runTool('dev.url.encode', {value:source,operation:'encode-component'});
  assert.equal(encoded.status, 'COMPLETED');
  assert.equal(encoded.output.value, 'hello%20world%2F%E9%9B%AA%20%26%20%3F');
  const decoded = await runTool('dev.url.encode', {value:encoded.output.value,operation:'decode-component'});
  assert.equal(decoded.status, 'COMPLETED');
  assert.equal(decoded.output.value, source);

  const uri = await runTool('dev.url.encode',{value:'https://example.test/a b?q=hello world',operation:'encode-uri'});
  assert.equal(uri.output.value,'https://example.test/a%20b?q=hello%20world');
  assert.equal((await runTool('dev.url.encode',{value:'%',operation:'decode-component'})).status,'INVALID_INPUT');
});

test('developer utility inputs are bounded and unsupported algorithms/modes fail closed', async () => {
  assert.equal((await runTool('dev.hash.generate',{text:12})).status,'INVALID_INPUT');
  assert.equal((await runTool('dev.hash.generate',{text:'abc',algorithm:'not-a-hash'})).status,'INVALID_INPUT');
  assert.equal((await runTool('dev.hash.generate',{text:'abc',encoding:'base32'})).status,'INVALID_INPUT');
  assert.equal((await runTool('security.checksum.verify',{text:'abc',expected:'ff',algorithm:'sha256',encoding:'hex'})).status,'INVALID_INPUT');
  assert.equal((await runTool('dev.url.encode',{value:'abc',operation:'execute'})).status,'INVALID_INPUT');
  assert.equal((await runTool('dev.url.encode',{value:123,operation:'encode-component'})).status,'INVALID_INPUT');
  for (const id of EXPECTED_TOOLS) {
    const result = await runTool(id,{});
    if (id === 'dev.uuid.generate') continue;
    assert.notEqual(result.status,'COMPLETED',id + ' must require valid input');
    assert.equal(result.networkUsed,false);
  }
});

test('dev.timestamp.convert performs explicit ISO-8601 and Unix second/millisecond conversions',async()=>{
  const contract=getToolContract('dev.timestamp.convert');
  assert.ok(contract);
  assert.equal(contract.executionMode,'local');
  assert.equal(contract.networkRequired,false);

  const seconds=await runTool('dev.timestamp.convert',{value:'1970-01-01T00:00:01.250Z',mode:'iso-to-unix-seconds'});
  assert.equal(seconds.status,'COMPLETED');
  assert.equal(seconds.output.unixSeconds,1.25);
  assert.equal(seconds.output.unixMilliseconds,1250);

  const milliseconds=await runTool('dev.timestamp.convert',{value:'1970-01-01T00:00:01.250Z',mode:'iso-to-unix-milliseconds'});
  assert.equal(milliseconds.output.unixMilliseconds,1250);

  const fromSeconds=await runTool('dev.timestamp.convert',{value:1.25,mode:'unix-seconds-to-iso'});
  assert.equal(fromSeconds.status,'COMPLETED');
  assert.equal(fromSeconds.output.iso,'1970-01-01T00:00:01.250Z');

  const fromMilliseconds=await runTool('dev.timestamp.convert',{value:0,mode:'unix-milliseconds-to-iso'});
  assert.equal(fromMilliseconds.output.iso,'1970-01-01T00:00:00.000Z');
  assert.equal(fromMilliseconds.networkUsed,false);
});

test('dev.timestamp.convert rejects ambiguous dates, missing offsets, invalid modes and out-of-range timestamps',async()=>{
  for(const input of [
    {},
    {value:'2026-02-30T10:00:00Z',mode:'iso-to-unix-seconds'},
    {value:'2026-01-01T10:00:00',mode:'iso-to-unix-seconds'},
    {value:'2026-01-01T25:00:00Z',mode:'iso-to-unix-seconds'},
    {value:1,mode:'iso-to-unix-seconds'},
    {value:'1',mode:'unix-seconds-to-iso'},
    {value:1,mode:'guess'},
    {value:1e20,mode:'unix-milliseconds-to-iso'},
    {value:1e20,mode:'unix-seconds-to-iso'}
  ]){
    const result=await runTool('dev.timestamp.convert',input);
    assert.notEqual(result.status,'COMPLETED',JSON.stringify(input));
    assert.equal(result.networkUsed,false);
  }
});

test('dev.cron.inspect validates five-field cron syntax and returns bounded UTC occurrences',async()=>{
  const contract=getToolContract('dev.cron.inspect');
  assert.ok(contract);
  assert.equal(contract.executionMode,'local');
  assert.equal(contract.networkRequired,false);
  const result=await runTool('dev.cron.inspect',{
    expression:'*/15 9-10 * * 1-5',
    after:'2026-10-05T08:59:00Z'
  });
  assert.equal(result.status,'COMPLETED');
  assert.deepEqual(result.output.nextRuns,[
    '2026-10-05T09:00:00.000Z',
    '2026-10-05T09:15:00.000Z',
    '2026-10-05T09:30:00.000Z',
    '2026-10-05T09:45:00.000Z',
    '2026-10-05T10:00:00.000Z'
  ]);
  assert.equal(result.output.timeZone,'UTC');
  assert.equal(result.networkUsed,false);
});

test('dev.cron.inspect applies documented OR semantics when both day fields are restricted',async()=>{
  const result=await runTool('dev.cron.inspect',{
    expression:'0 9 1 * 1',
    after:'2026-10-02T10:00:00Z'
  });
  assert.equal(result.status,'COMPLETED');
  assert.equal(result.output.dayMatchPolicy,'day-of-month OR day-of-week when both are restricted');
  assert.deepEqual(result.output.nextRuns.slice(0,2),[
    '2026-10-05T09:00:00.000Z',
    '2026-10-12T09:00:00.000Z'
  ]);
});

test('dev.cron.inspect rejects unsupported cron syntax, invalid offsets and extra options',async()=>{
  for(const input of [
    {},
    {expression:'* * * *'},
    {expression:'60 * * * *'},
    {expression:'*/0 * * * *'},
    {expression:'10-2 * * * *'},
    {expression:'a b c d e'},
    {expression:'* * * * *',after:'2026-10-01T00:00:00'},
    {expression:'* * * * *',after:'2026-02-30T00:00:00Z'},
    {expression:'* * * * *',after:'2026-10-01T00:00:00Z',timeZone:'America/New_York'}
  ]){
    const result=await runTool('dev.cron.inspect',input);
    assert.notEqual(result.status,'COMPLETED',JSON.stringify(input));
    assert.equal(result.networkUsed,false);
  }
});

test('dev.cron.inspect reports valid schedules with no match inside its bounded search window',async()=>{
  const result=await runTool('dev.cron.inspect',{
    expression:'0 0 31 2 *',
    after:'2026-01-01T00:00:00Z'
  });
  assert.equal(result.status,'COMPLETED');
  assert.deepEqual(result.output.nextRuns,[]);
  assert.equal(result.output.searchWindowDays,366);
  assert.ok(result.warnings.some(message=>/no occurrence/i.test(message)));
});

test('security.password.generate creates a cryptographically random password satisfying selected character classes',async()=>{
  const contract=getToolContract('security.password.generate');
  assert.ok(contract);
  assert.equal(contract.executionMode,'local');
  assert.equal(contract.networkRequired,false);
  const result=await runTool('security.password.generate',{length:32});
  assert.equal(result.status,'COMPLETED');
  assert.equal(result.output.password.length,32);
  assert.ok(/[a-z]/.test(result.output.password));
  assert.ok(/[A-Z]/.test(result.output.password));
  assert.ok(/[0-9]/.test(result.output.password));
  assert.ok(/[!@#$%^&*()\-_=+\[\]{}:,.?]/.test(result.output.password));
  assert.equal(result.output.cryptographicallySecure,true);
  assert.equal(result.output.length,32);
  assert.equal(result.networkUsed,false);
});

test('security.password.generate supports a restricted character policy and excludes ambiguous characters by default',async()=>{
  const result=await runTool('security.password.generate',{
    length:24,lowercase:true,uppercase:false,digits:true,symbols:false
  });
  assert.equal(result.status,'COMPLETED');
  assert.equal(result.output.password.length,24);
  assert.match(result.output.password,/^[a-z2-9]+$/);
  assert.ok(!/[ilo01]/i.test(result.output.password));
  assert.deepEqual(result.output.selectedClasses,['lowercase','digits']);
  assert.equal(result.networkUsed,false);
});

test('security.password.generate rejects weak lengths, invalid options and an empty character policy',async()=>{
  for(const input of [
    {},
    {length:11},
    {length:129},
    {length:12.5},
    {length:20,lowercase:false,uppercase:false,digits:false,symbols:false},
    {length:20,lowercase:'yes'},
    {length:20,unknownOption:true}
  ]){
    const result=await runTool('security.password.generate',input);
    assert.notEqual(result.status,'COMPLETED',JSON.stringify(input));
    assert.equal(result.networkUsed,false);
  }
});

