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
  assert.equal(result.output.csv,'text,quote,nested,tags\r\n"line 1, line 2","She said ""yes""","{""ok"":true}","[""a"",""b""]"\r\n"next\nline",,,[]');
});

test('data.json.csv prevents spreadsheet formula injection in string cells but preserves numeric cells',async()=>{
  const result=await runTool('data.json.csv',{json:[
    {unsafe:'=HYPERLINK("https://example.test","open")',alsoUnsafe:'  @SUM(A1:A2)',number:-12,plain:'safe'}
  ]});
  assert.equal(result.status,'COMPLETED');
  assert.equal(result.output.csv,'unsafe,alsoUnsafe,number,plain\r\n"\'=HYPERLINK(""https://example.test"",""open"")",\'  @SUM(A1:A2),-12,safe');
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

test('data.csv.json is a canonical local contract and parses RFC-style quoting into string-valued objects',async()=>{
  const contract=getToolContract('data.csv.json');
  assert.ok(contract);
  assert.equal(contract.executionMode,'local');
  assert.equal(contract.networkRequired,false);
  const result=await runTool('data.csv.json',{csv:'name,age,notes\r\nAda,36,"likes, commas"\r\nGrace,,"line 1\nline 2"'});
  assert.equal(result.status,'COMPLETED');
  assert.deepEqual(result.output.columns,['name','age','notes']);
  assert.equal(result.output.rowCount,2);
  assert.deepEqual(result.output.json,[
    {name:'Ada',age:'36',notes:'likes, commas'},
    {name:'Grace',age:'',notes:'line 1\nline 2'}
  ]);
  assert.equal(result.networkUsed,false);
});

test('data.csv.json handles BOM, doubled quotes, empty trailing cells and LF records',async()=>{
  const result=await runTool('data.csv.json',{csv:'\uFEFFid,value\n1,"say ""yes"""\n2,'});
  assert.equal(result.status,'COMPLETED');
  assert.deepEqual(result.output.json,[{id:'1',value:'say "yes"'},{id:'2',value:''}]);
  assert.equal(result.output.jsonString,'[{"id":"1","value":"say \\"yes\\""},{"id":"2","value":""}]');
});

test('data.csv.json rejects malformed CSV, unsafe or duplicate headers and unsupported options',async()=>{
  for(const input of [
    {},
    {csv:''},
    {csv:12},
    {csv:'a,b\n1,"unclosed'},
    {csv:'a,b\n1,broken"quote'},
    {csv:'a,b\n1,"quoted"x'},
    {csv:'a,b\n1,2\r3,4'},
    {csv:'a,a\n1,2'},
    {csv:',b\n1,2'},
    {csv:'__proto__,value\nx,y'},
    {csv:'a,b\n1,2',delimiter:';'}
  ]){
    const result=await runTool('data.csv.json',input);
    assert.notEqual(result.status,'COMPLETED',JSON.stringify(input));
    assert.equal(result.networkUsed,false);
  }
});

test('data.csv.json enforces row, column, cell and input-size budgets',async()=>{
  const tooManyRows='a\n'+Array.from({length:10_001},()=> 'x').join('\n');
  const tooManyColumns=Array.from({length:201},(_,i)=>'c'+i).join(',');
  const tooManyCell='a\n'+('x'.repeat(100_001));
  const tooMuchInput='a\n'+('x'.repeat(500_001));
  for(const csv of [
    tooManyRows,
    tooManyColumns+'\n'+Array(201).fill('x').join(','),
    tooManyCell,
    tooMuchInput
  ]){
    const result=await runTool('data.csv.json',{csv});
    assert.notEqual(result.status,'COMPLETED');
    assert.equal(result.networkUsed,false);
  }
});

test('data.json.yaml is a canonical local contract and serializes nested JSON as safe YAML',async()=>{
  const contract=getToolContract('data.json.yaml');
  assert.ok(contract);
  assert.equal(contract.executionMode,'local');
  assert.equal(contract.networkRequired,false);
  const result=await runTool('data.json.yaml',{json:'{"name":"Build Vibe","active":true,"empty":"","count":2,"items":["alpha","line\\nbreak"],"nested":{"note":"a: b"}}'});
  assert.equal(result.status,'COMPLETED');
  assert.equal(result.output.yaml,'"name": "Build Vibe"\\n"active": true\\n"empty": ""\\n"count": 2\\n"items":\\n  - "alpha"\\n  - "line\\\\nbreak"\\n"nested":\\n  "note": "a: b"');
  assert.equal(result.output.nodeCount,10);
  assert.equal(result.networkUsed,false);
});

test('data.json.yaml quotes ambiguous strings and preserves JSON scalar types',async()=>{
  const result=await runTool('data.json.yaml',{json:'{"danger":"=cmd","colon":"a: b","hash":"#tag","yes":"yes","nil":null,"flag":false,"number":7}'});
  assert.equal(result.status,'COMPLETED');
  assert.match(result.output.yaml,/"danger": "=cmd"/);
  assert.match(result.output.yaml,/"colon": "a: b"/);
  assert.match(result.output.yaml,/"hash": "#tag"/);
  assert.match(result.output.yaml,/"yes": "yes"/);
  assert.match(result.output.yaml,/"nil": null/);
  assert.match(result.output.yaml,/"flag": false/);
  assert.match(result.output.yaml,/"number": 7/);
});

test('data.json.yaml rejects invalid JSON, unsafe keys, excessive depth and unknown options',async()=>{
  for(const input of [
    {},
    {json:'{'},
    {json:123},
    {json:'{"__proto__":"unsafe"}'},
    {json:'{"constructor":{"prototype":1}}'},
    {json:'{"ok":true}',format:'flow'}
  ]){
    const result=await runTool('data.json.yaml',input);
    assert.notEqual(result.status,'COMPLETED');
    assert.equal(result.networkUsed,false);
  }
  let deep='0';
  for(let i=0;i<22;i++)deep='{"nested":'+deep+'}';
  assert.notEqual((await runTool('data.json.yaml',{json:deep})).status,'COMPLETED');
});

test('data.json.yaml enforces JSON input and output resource budgets',async()=>{
  const tooLarge=JSON.stringify({value:'x'.repeat(500_001)});
  const result=await runTool('data.json.yaml',{json:tooLarge});
  assert.equal(result.status,'INPUT_TOO_LARGE');
  assert.equal(result.networkUsed,false);
});

