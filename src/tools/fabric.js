export const TOOL_FABRIC_VERSION='1.0';
export const TOOL_FABRIC_LIMITS=Object.freeze({inputBytes:256*1024,jsonDepth:64,jsonNodes:12000,outputBytes:1024*1024});

const baseTextSchema={type:'string',maxLength:262144};
const definitions=[
  {id:'seo.meta.generate',aliases:['seo.meta'],label:'SEO metadata generator',category:'seo',description:'Generate bounded title and description metadata from page information.',networkRequired:false,riskLevel:'low',status:'planned',inputSchema:{type:'object',properties:{title:{type:'string',maxLength:240},description:{type:'string',maxLength:500}},required:['title','description'],additionalProperties:false},outputSchema:{type:'object'}},
  {id:'seo.sitemap.generate',aliases:['seo.sitemap'],label:'XML sitemap generator',category:'seo',description:'Create a sitemap from an explicit list of public URL paths.',networkRequired:false,riskLevel:'low',status:'planned',inputSchema:{type:'object',properties:{baseUrl:{type:'string',maxLength:2048},paths:{type:'array',maxItems:1000,items:{type:'string',maxLength:2048}}},required:['baseUrl','paths'],additionalProperties:false},outputSchema:{type:'object'}},
  {id:'seo.robots.generate',aliases:['robots.generate'],label:'Robots.txt generator',category:'seo',description:'Generate bounded robots directives without guessing provider-specific crawl rules.',networkRequired:false,riskLevel:'low',status:'planned',inputSchema:{type:'object',properties:{sitemapUrl:{type:'string',maxLength:2048}},additionalProperties:false},outputSchema:{type:'object'}},
  {id:'web.favicon.generate',aliases:['favicon.generate'],label:'Favicon and app-icon contract',category:'web',description:'Validate icon manifest metadata and prepare a deterministic icon asset plan.',networkRequired:false,riskLevel:'low',status:'planned',inputSchema:{type:'object',properties:{name:{type:'string',maxLength:120},sizes:{type:'array',items:{type:'integer'}}},required:['name'],additionalProperties:false},outputSchema:{type:'object'}},
  {id:'seo.og.generate',aliases:['og.generate'],label:'Social preview metadata',category:'seo',description:'Generate safe Open Graph and social-preview metadata fields.',networkRequired:false,riskLevel:'low',status:'planned',inputSchema:{type:'object',properties:{title:{type:'string',maxLength:240},description:{type:'string',maxLength:500},imageUrl:{type:'string',maxLength:2048}},required:['title','description'],additionalProperties:false},outputSchema:{type:'object'}},
  {id:'seo.audit',aliases:['seo.audit.run'],label:'SEO audit',category:'seo',description:'Audit a supplied page snapshot for metadata, heading and link completeness.',networkRequired:false,riskLevel:'low',status:'planned',inputSchema:{type:'object',properties:{html:{type:'string',maxLength:262144}},required:['html'],additionalProperties:false},outputSchema:{type:'object'}},
  {id:'web.performance.audit',aliases:['performance.audit'],label:'Web performance audit',category:'web',description:'Collect performance measures from an explicitly authorized browser target.',networkRequired:true,riskLevel:'medium',status:'planned',inputSchema:{type:'object',properties:{url:{type:'string',maxLength:2048}},required:['url'],additionalProperties:false},outputSchema:{type:'object'}},
  {id:'web.accessibility.audit',aliases:['a11y.audit'],label:'Accessibility audit',category:'web',description:'Review an explicitly authorized page for semantic and accessible-control issues.',networkRequired:true,riskLevel:'medium',status:'planned',inputSchema:{type:'object',properties:{url:{type:'string',maxLength:2048}},required:['url'],additionalProperties:false},outputSchema:{type:'object'}},
  {id:'image.optimize',aliases:['image.optimize.local'],label:'Image optimization',category:'media',description:'Optimize a supplied image through a configured local image codec.',networkRequired:false,riskLevel:'low',status:'planned',inputSchema:{type:'object',properties:{assetId:{type:'string',maxLength:80},format:{type:'string',enum:['webp','avif','png','jpeg']}},required:['assetId','format'],additionalProperties:false},outputSchema:{type:'object'}},
  {id:'dev.json.format',aliases:['json.format','json.validate'],label:'JSON formatter and validator',category:'developer',description:'Validate and format JSON without sending it to a third party.',networkRequired:false,riskLevel:'low',status:'available',inputSchema:{type:'object',properties:{text:baseTextSchema,indent:{type:'integer',minimum:0,maximum:8}},required:['text'],additionalProperties:false},outputSchema:{type:'object',properties:{formatted:{type:'string'},valid:{type:'boolean'},bytes:{type:'integer'}}}},
  {id:'dev.json.typescript',aliases:['json.to-typescript','json.typescript'],label:'JSON to TypeScript',category:'developer',description:'Infer deterministic TypeScript interfaces from a JSON object sample.',networkRequired:false,riskLevel:'low',status:'available',inputSchema:{type:'object',properties:{text:baseTextSchema,rootName:{type:'string',maxLength:80}},required:['text'],additionalProperties:false},outputSchema:{type:'object',properties:{rootType:{type:'string'},typescript:{type:'string'}}}},
  {id:'dev.api.test',aliases:['api.tester'],label:'API endpoint tester',category:'developer',description:'Test an endpoint only after origin, private-network and egress policy controls are configured.',networkRequired:true,riskLevel:'high',status:'planned',inputSchema:{type:'object',properties:{url:{type:'string',maxLength:2048},method:{type:'string',enum:['GET','HEAD','POST']}},required:['url'],additionalProperties:false},outputSchema:{type:'object'}},
  {id:'dev.regex.test',aliases:['regex.tester'],label:'Regular-expression tester',category:'developer',description:'Test a bounded regular expression under an execution-time isolation policy.',networkRequired:false,riskLevel:'medium',status:'planned',inputSchema:{type:'object',properties:{pattern:{type:'string',maxLength:512},text:{type:'string',maxLength:65536}},required:['pattern','text'],additionalProperties:false},outputSchema:{type:'object'}},
  {id:'security.jwt.inspect',aliases:['jwt.inspect'],label:'JWT claims inspector',category:'security',description:'Decode JWT header and claims for inspection; never verifies signatures or authorizes tokens.',networkRequired:false,riskLevel:'medium',status:'available',inputSchema:{type:'object',properties:{token:{type:'string',maxLength:32768}},required:['token'],additionalProperties:false},outputSchema:{type:'object',properties:{header:{type:'object'},payload:{type:'object'},signatureVerified:{type:'boolean'},warning:{type:'string'}}}},
  {id:'dev.base64',aliases:['base64'],label:'Base64 encoder and decoder',category:'developer',description:'Encode or decode UTF-8 text as canonical Base64 locally.',networkRequired:false,riskLevel:'low',status:'available',inputSchema:{type:'object',properties:{mode:{type:'string',enum:['encode','decode']},text:{type:'string',maxLength:262144}},required:['mode','text'],additionalProperties:false},outputSchema:{type:'object',properties:{mode:{type:'string'},value:{type:'string'}}}},
  {id:'design.color.palette',aliases:['color.palette'],label:'Color-palette helper',category:'design',description:'Create accessible color-palette candidates from a valid seed color.',networkRequired:false,riskLevel:'low',status:'planned',inputSchema:{type:'object',properties:{seed:{type:'string',pattern:'^#[0-9a-fA-F]{6}$'}},required:['seed'],additionalProperties:false},outputSchema:{type:'object'}},
  {id:'design.css.gradient',aliases:['css.gradient'],label:'CSS gradient generator',category:'design',description:'Generate CSS gradients from bounded color stops and direction values.',networkRequired:false,riskLevel:'low',status:'planned',inputSchema:{type:'object',properties:{colors:{type:'array',minItems:2,maxItems:8,items:{type:'string'}},direction:{type:'string',maxLength:40}},required:['colors'],additionalProperties:false},outputSchema:{type:'object'}},
  {id:'qr.generate',aliases:['qr'],label:'QR-code generator',category:'media',description:'Generate QR image output from a bounded payload using a configured encoder.',networkRequired:false,riskLevel:'low',status:'planned',inputSchema:{type:'object',properties:{text:{type:'string',maxLength:2048}},required:['text'],additionalProperties:false},outputSchema:{type:'object'}}
];

const DEFINITION_BY_ID=new Map();
for(const definition of definitions)for(const key of [definition.id,...definition.aliases])DEFINITION_BY_ID.set(key,definition);
const AVAILABLE_IDS=new Set(['dev.json.format','dev.json.typescript','dev.base64','security.jwt.inspect']);

function metadata(definition){
  const networkRequired=Boolean(definition.networkRequired);
  return {...structuredClone(definition),version:TOOL_FABRIC_VERSION,owner:'build-vibe',
    executionMode:networkRequired?'network':'local',
    privacyMode:networkRequired?'network-requires-explicit-consent':'server-local-no-third-party',
    authenticationRequired:true,confirmationRequired:networkRequired,
    timeoutMs:networkRequired?8000:1500,retries:0,auditEvent:'tool.executed',
    fallback:networkRequired?'blocked_until_network_policy_and_consent_are_configured':'bounded_error_no_external_fallback',
    status:AVAILABLE_IDS.has(definition.id)?'available':'planned'};
}
export function listToolDefinitions({implementedOnly=false,includePlanned=true}={}){
  return definitions.map(metadata).filter(tool=>(!implementedOnly||tool.status==='available')&&(includePlanned||tool.status==='available'));
}
export function getToolDefinition(id){
  const definition=DEFINITION_BY_ID.get(String(id||'').trim().toLowerCase());
  return definition?metadata(definition):null;
}
function fail(code,status,message){const error=new Error(message);error.code=code;error.status=status;throw error;}
function isPlainObject(value){return value!==null&&typeof value==='object'&&!Array.isArray(value)&&(Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null);}
function requireObject(input,allowed){
  if(!isPlainObject(input))fail('invalid_tool_input',400,'Tool input must be a JSON object.');
  for(const key of Object.keys(input))if(!allowed.includes(key))fail('invalid_tool_input',400,'Unsupported input field: '+key);
  let bytes;
  try{bytes=Buffer.byteLength(JSON.stringify(input),'utf8')}catch{fail('invalid_tool_input',400,'Tool input must be JSON-serializable.');}
  if(bytes>TOOL_FABRIC_LIMITS.inputBytes)fail('tool_input_too_large',413,'Tool input exceeds the 256 KB limit.');
  return bytes;
}
function requireText(value,field,{maxBytes=TOOL_FABRIC_LIMITS.inputBytes,allowEmpty=false}={}){
  if(typeof value!=='string'||(!allowEmpty&&!value.trim()))fail('invalid_tool_input',400,field+' must be a non-empty string.');
  if(Buffer.byteLength(value,'utf8')>maxBytes)fail('tool_input_too_large',413,field+' exceeds the allowed byte limit.');
  return value;
}
function assertJsonBudget(value){
  const pending=[[value,0]];let count=0;
  while(pending.length){
    const pair=pending.pop(),current=pair[0],depth=pair[1];
    if(depth>TOOL_FABRIC_LIMITS.jsonDepth)fail('json_complexity_limit_exceeded',422,'JSON nesting exceeds the 64-level limit.');
    if(++count>TOOL_FABRIC_LIMITS.jsonNodes)fail('json_complexity_limit_exceeded',422,'JSON contains too many values.');
    if(current&&typeof current==='object'){
      const values=Array.isArray(current)?current:Object.values(current);
      for(const child of values)pending.push([child,depth+1]);
    }
  }
}
function parseJson(text){
  let parsed;
  try{parsed=JSON.parse(text)}catch(error){fail('invalid_json',422,'Input is not valid JSON: '+String(error?.message||'parse error').slice(0,180));}
  assertJsonBudget(parsed);return parsed;
}
function formatJson(input){
  requireObject(input,['text','indent']);
  const text=requireText(input.text,'text'),indent=input.indent===undefined?2:input.indent;
  if(!Number.isInteger(indent)||indent<0||indent>8)fail('invalid_indent',400,'indent must be an integer from 0 to 8.');
  const parsed=parseJson(text);let formatted;
  try{formatted=JSON.stringify(parsed,null,indent)}catch{fail('json_complexity_limit_exceeded',422,'JSON could not be safely formatted.');}
  const bytes=Buffer.byteLength(formatted,'utf8');
  if(bytes>TOOL_FABRIC_LIMITS.outputBytes)fail('tool_output_too_large',413,'Formatted JSON exceeds the 1 MB output limit.');
  return {formatted,valid:true,bytes};
}
const TS_RESERVED=new Set(['break','case','catch','class','const','continue','debugger','default','delete','do','else','enum','export','extends','false','finally','for','function','if','import','in','instanceof','new','null','return','super','switch','this','throw','true','try','typeof','var','void','while','with','yield','let','static','implements','package','protected','interface','private','public','await','__proto__','constructor','prototype']);
function typeName(value){
  const parts=String(value||'').match(/[A-Za-z0-9_$]+/g)||[];
  let name=parts.map(part=>part.charAt(0).toUpperCase()+part.slice(1)).join('');
  if(!name)name='Root';if(/^[0-9]/.test(name))name='T'+name;
  if(TS_RESERVED.has(name.toLowerCase()))name+='Type';
  return name.slice(0,72);
}
function propertyName(key){return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)&&!TS_RESERVED.has(key)?key:JSON.stringify(key);}
function inferType(value,hint,state,depth=0){
  if(depth>TOOL_FABRIC_LIMITS.jsonDepth)fail('json_complexity_limit_exceeded',422,'JSON nesting exceeds the TypeScript inference limit.');
  if(value===null)return 'null';if(typeof value==='string')return 'string';if(typeof value==='number')return 'number';if(typeof value==='boolean')return 'boolean';
  if(Array.isArray(value)){
    if(!value.length)return 'unknown[]';
    if(value.every(item=>isPlainObject(item)))return inferType(value[0],hint+'Item',state,depth+1)+'[]';
    const variants=[];
    for(let index=0;index<Math.min(value.length,32);index++){
      const variant=inferType(value[index],hint+'Variant'+(index+1),state,depth+1);
      if(!variants.includes(variant))variants.push(variant);
    }
    return variants.length===1?variants[0]+'[]':'('+variants.join(' | ')+')[]';
  }
  if(isPlainObject(value)){
    const base=typeName(hint);let name=base,suffix=2;
    while(state.names.has(name))name=base+suffix++;
    state.names.add(name);const fields=[];
    for(const key of Object.keys(value)){
      const type=inferType(value[key],name+typeName(key),state,depth+1);
      fields.push('  '+propertyName(key)+': '+type+';');
    }
    state.interfaces.push('export interface '+name+' {\\n'+(fields.length?fields.join('\\n'):'  [key: string]: unknown;')+'\\n}');
    return name;
  }
  return 'unknown';
}
function jsonToTypescript(input){
  requireObject(input,['text','rootName']);
  const text=requireText(input.text,'text');
  const rootName=input.rootName===undefined?'Root':requireText(input.rootName,'rootName',{maxBytes:80});
  const parsed=parseJson(text);
  if(!isPlainObject(parsed))fail('json_root_must_be_object',422,'The JSON root must be an object to infer an interface.');
  const state={names:new Set(),interfaces:[]};
  const rootType=inferType(parsed,typeName(rootName),state);
  const typescript=state.interfaces.join('\\n\\n')+'\\n';
  if(Buffer.byteLength(typescript,'utf8')>TOOL_FABRIC_LIMITS.outputBytes)fail('tool_output_too_large',413,'Generated TypeScript exceeds the 1 MB output limit.');
  return {rootType,typescript};
}
function base64(input){
  requireObject(input,['mode','text']);
  if(!['encode','decode'].includes(input.mode))fail('invalid_base64_mode',400,'mode must be encode or decode.');
  const text=requireText(input.text,'text',{allowEmpty:true});let value;
  if(input.mode==='encode')value=Buffer.from(text,'utf8').toString('base64');
  else{
    if(!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(text)||Buffer.from(text,'base64').toString('base64')!==text)
      fail('invalid_base64',422,'Input must be canonical Base64.');
    value=Buffer.from(text,'base64').toString('utf8');
  }
  if(Buffer.byteLength(value,'utf8')>TOOL_FABRIC_LIMITS.outputBytes)fail('tool_output_too_large',413,'Decoded or encoded output exceeds the output limit.');
  return {mode:input.mode,value};
}
function decodeJwtPart(part){
  if(!/^[A-Za-z0-9_-]+$/.test(part))fail('invalid_jwt',422,'JWT contains an invalid encoded segment.');
  let result;try{result=JSON.parse(Buffer.from(part,'base64url').toString('utf8'))}catch{fail('invalid_jwt',422,'JWT header and payload must contain valid JSON.');}
  if(!isPlainObject(result))fail('invalid_jwt',422,'JWT header and payload must be JSON objects.');
  return result;
}
function inspectJwt(input,now=Date.now()){
  requireObject(input,['token']);const token=requireText(input.token,'token',{maxBytes:32*1024}),parts=token.split('.');
  if(parts.length!==3||!parts[2]&&!/^[A-Za-z0-9_-]*$/.test(parts[2]||'')||!parts[2]&&parts[0]!=='')fail('invalid_jwt',422,'Expected a compact JWT with three segments.');
  const header=decodeJwtPart(parts[0]),payload=decodeJwtPart(parts[1]);
  if(!/^[A-Za-z0-9_-]*$/.test(parts[2]))fail('invalid_jwt',422,'JWT signature segment is malformed.');
  const expired=typeof payload.exp==='number'?payload.exp<=Math.floor(now/1000):null;
  return {header,payload,expired,signatureVerified:false,warning:'signature_not_verified'};
}
const executors={'dev.json.format':formatJson,'dev.json.typescript':jsonToTypescript,'dev.base64':base64,'security.jwt.inspect':input=>inspectJwt(input)};
export function executeLocalTool(id,input){
  const definition=DEFINITION_BY_ID.get(String(id||'').trim().toLowerCase());
  if(!definition)fail('tool_not_found',404,'Tool ID was not found in the canonical catalog.');
  if(!AVAILABLE_IDS.has(definition.id)||!executors[definition.id])fail('tool_not_available',501,'This tool is cataloged but its execution adapter is not implemented.');
  const inputBytes=requireObject(input,Object.keys(input||{}));
  let output;
  try{output=executors[definition.id](input)}catch(error){
    if(error?.code&&error?.status)throw error;
    fail('tool_execution_failed',422,'Tool execution failed safely: '+String(error?.message||'invalid input').slice(0,160));
  }
  const outputBytes=Buffer.byteLength(JSON.stringify(output),'utf8');
  if(outputBytes>TOOL_FABRIC_LIMITS.outputBytes)fail('tool_output_too_large',413,'Tool output exceeds the 1 MB output limit.');
  return {ok:true,version:TOOL_FABRIC_VERSION,tool:{id:definition.id,label:definition.label,privacyMode:'server-local-no-third-party'},output,execution:{mode:'local',networkRequired:false,sideEffects:false,inputBytes,outputBytes}};
}
