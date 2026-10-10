import test from 'node:test';
import assert from 'node:assert/strict';
import {getToolContract,runTool} from '../src/tool-fabric/index.js';

test('data.json.csv is a canonical local contract and converts object rows with stable columns', async()=>{
  const contract=getToolContract('data.json.csv');
  assert.ok(contract);
  assert.equal(contract.executionMode,'local');
  assert.equal(contract.networkRequired,false);
  const result=await runTool('data.json.csv',{json:[
    {name:'Ada',age:36,active:true},
    {name:'Grace',active:false,city:'New York'}
  ]});
  assert.equal(result.status,'COMPLETED');
  assert.equal(result.output.rowCount,2);
  assert.deepEqual(result.output.columns,['name','age','active','city']);
  assert.equal(result.output.csv,'name,age,active,city\r\nAda,36,true,\r\nGrace,,false,New York');
  assert.equal(result.networkUsed,false);
});

test('data.json.csv quotes commas, quotes and newlines and serializes nested values deterministically',async()=>{
  const result=await runTool('data.json.csv',{json:[
    {text:'line 1, line 2',quote:'She said "yes"',nested:{ok:true},tags:['a','b']},
    {text:'next\nline',quote:'',nested:null,tags:[]}
  ]});
  assert.equal(result.status,'COMPLETED');
  assert.equal(result.output.csv,'text,quote,nested,tags\r\n"line 1, line 2","She said ""yes""","{""ok"":true}","[""a"",""b""]"\r\n"next\nline",,,"[]"');
});

test('data.json.csv prevents spreadsheet formula injection in string cells but preserves numeric cells',async()=>{
  const result=await runTool('data.json.csv',{json:[
    {unsafe:'=HYPERLINK("https://example.test","open")',alsoUnsafe:'  @SUM(A1:A2)',number:-12,plain:'safe'}
  ]});
  assert.equal(result.status,'COMPLETED');
  assert.equal(result.output.csv,'unsafe,alsoUnsafe,number,plain\n"\'=HYPERLINK(""https://example.test"",""open"")","\'  @SUM(A1:A2)",-12,safe');
  assert.equal(result.output.sanitizedCellCount,2);
  assert.ok(result.warnings.some(message=>/spreadsheet formula/i.test(message)));
});

test('data.json.csv rejects invalid shapes, non-scalar rows and over-budget data',async()=>{
  for(const input of [
    {},
    {json:{}},
    {json:[]},
    {json:[1,2]},
    {json:[{ok:1},null]},
    {json:[{ok:undefined}]},
    {json:[{['x'.repeat(100_001)]:'too-long'}]},
    {json:Array.from({length:10_001},()=>({a:1}))}
  ]){
    const result=await runTool('data.json.csv',input);
    assert.notEqual(result.status,'COMPLETED',JSON.stringify(input).slice(0,80));
    assert.equal(result.networkUsed,false);
  }
});

test('data.json.csv rejects dangerous column keys and unknown options',async()=>{
  const prototypeKey=JSON.parse('{"__proto__":"x"}');
  const result=await runTool('data.json.csv',{json:[prototypeKey]});
  assert.notEqual(result.status,'COMPLETED');
  assert.equal(result.networkUsed,false);
  assert.notEqual((await runTool('data.json.csv',{json:[{ok:1}],delimiter:';'})).status,'COMPLETED');
});
