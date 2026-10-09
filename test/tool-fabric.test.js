import test from 'node:test';
import assert from 'node:assert/strict';
import { executeLocalTool, getToolDefinition, listToolDefinitions, TOOL_FABRIC_VERSION } from '../src/tools/fabric.js';

test('canonical Tool Fabric exposes unique, fully classified contracts for the 18 planned utilities',()=>{
  const tools=listToolDefinitions();
  assert.equal(TOOL_FABRIC_VERSION,'1.0');
  assert.equal(tools.length,18);
  assert.equal(new Set(tools.map(tool=>tool.id)).size,18);
  for(const tool of tools){
    assert.match(tool.id,/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)+$/);
    for(const key of ['category','description','owner','privacyMode','executionMode','networkRequired','authenticationRequired','confirmationRequired','riskLevel','timeoutMs','retries','auditEvent','fallback','status','inputSchema','outputSchema']){
      assert.ok(Object.hasOwn(tool,key),tool.id+' missing '+key);
    }
    assert.equal(tool.owner,'build-vibe');
    assert.equal(tool.authenticationRequired,true);
    assert.ok(['available','planned'].includes(tool.status));
    assert.ok(['low','medium','high'].includes(tool.riskLevel));
    assert.equal(Number.isInteger(tool.timeoutMs),true);
    assert.equal(Number.isInteger(tool.retries),true);
  }
  const implemented=listToolDefinitions({implementedOnly:true}).map(tool=>tool.id).sort();
  assert.deepEqual(implemented,['dev.base64','dev.json.format','dev.json.typescript','security.jwt.inspect']);
  assert.equal(getToolDefinition('json.format').id,'dev.json.format');
  assert.equal(getToolDefinition('api.tester').id,'dev.api.test');
});

test('JSON formatter is deterministic, bounded, and declares that it never leaves the local executor',()=>{
  const result=executeLocalTool('dev.json.format',{text:'{"name":"Ada","items":[1,2],"active":true}',indent:4});
  assert.equal(result.ok,true);
  assert.equal(result.tool.id,'dev.json.format');
  assert.equal(result.output.valid,true);
  assert.equal(result.output.formatted,JSON.stringify({name:'Ada',items:[1,2],active:true},null,4));
  assert.equal(result.execution.mode,'local');
  assert.equal(result.execution.networkRequired,false);
  assert.equal(result.execution.sideEffects,false);
  assert.throws(()=>executeLocalTool('dev.json.format',{text:'{"unterminated":'}),error=>error.code==='invalid_json'&&error.status===422);
  assert.throws(()=>executeLocalTool('dev.json.format',{text:'{}',indent:99}),error=>error.code==='invalid_indent');
  assert.throws(()=>executeLocalTool('dev.json.format',{text:' '.repeat(300_000)}),error=>error.code==='tool_input_too_large'&&error.status===413);
  assert.throws(()=>executeLocalTool('dev.json.format',{text:'{}',unexpected:true}),error=>error.code==='invalid_tool_input');
});

test('JSON-to-TypeScript creates stable nested interfaces and safely quotes hostile property names',()=>{
  const input=JSON.stringify({
    id:7,
    'first-name':'Ada',
    meta:{active:true},
    tags:['a','b'],
    rows:[{amount:1}],
    '__proto__':'plain data'
  });
  const result=executeLocalTool('dev.json.typescript',{text:input,rootName:'StoreItem'});
  assert.equal(result.output.rootType,'StoreItem');
  assert.match(result.output.typescript,/export interface StoreItem\b/);
  assert.match(result.output.typescript,/export interface StoreItemMeta\b/);
  assert.match(result.output.typescript,/export interface StoreItemRowsItem\b/);
  assert.match(result.output.typescript,/\"first-name\": string;/);
  assert.match(result.output.typescript,/\"__proto__\": string;/);
  assert.match(result.output.typescript,/tags: string\[\];/);
  assert.throws(()=>executeLocalTool('dev.json.typescript',{text:'null'}),error=>error.code==='json_root_must_be_object');
  assert.throws(()=>executeLocalTool('dev.json.typescript',{text:'{"a":'.padEnd(300_000,' ')}),error=>error.code==='tool_input_too_large');
});

test('Base64 encode/decode works locally and rejects non-canonical encoded input',()=>{
  const encoded=executeLocalTool('dev.base64',{mode:'encode',text:'Build Vibe ✓'});
  assert.equal(encoded.output.value,Buffer.from('Build Vibe ✓','utf8').toString('base64'));
  const decoded=executeLocalTool('dev.base64',{mode:'decode',text:encoded.output.value});
  assert.equal(decoded.output.value,'Build Vibe ✓');
  assert.equal(decoded.execution.networkRequired,false);
  assert.throws(()=>executeLocalTool('dev.base64',{mode:'decode',text:'%%%'}),error=>error.code==='invalid_base64');
  assert.throws(()=>executeLocalTool('dev.base64',{mode:'encode',text:'x',extra:'y'}),error=>error.code==='invalid_tool_input');
});

test('JWT inspector decodes claims but never presents base64 parsing as signature verification',()=>{
  const part=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
  const token=part({alg:'HS256',typ:'JWT'})+'.'+part({sub:'user-1',exp:1,role:'user'})+'.c2ln';
  const result=executeLocalTool('security.jwt.inspect',{token});
  assert.deepEqual(result.output.header,{alg:'HS256',typ:'JWT'});
  assert.equal(result.output.payload.sub,'user-1');
  assert.equal(result.output.expired,true);
  assert.equal(result.output.signatureVerified,false);
  assert.equal(result.output.warning,'signature_not_verified');
  assert.equal(result.execution.networkRequired,false);
  assert.throws(()=>executeLocalTool('security.jwt.inspect',{token:'not.a.jwt'}),error=>error.code==='invalid_jwt');
});

test('planned network tools are discoverable but cannot be executed through the local-only endpoint',()=>{
  const api=getToolDefinition('dev.api.test');
  assert.equal(api.status,'planned');
  assert.equal(api.networkRequired,true);
  assert.equal(api.confirmationRequired,true);
  assert.throws(()=>executeLocalTool('dev.api.test',{url:'https://example.com'}),error=>error.code==='tool_not_available'&&error.status===501);
  assert.throws(()=>executeLocalTool('missing.tool',{}),error=>error.code==='tool_not_found'&&error.status===404);
});
