import {TOOL_CONTRACTS, getToolContract, listToolContracts} from './contracts.js';
import {generateQrSvg} from './qr.js';

class ToolFailure extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
function fail(status, tool, error, output) {
  const result = {ok:false,status,tool,error:String(error || status).slice(0,240),networkUsed:false};
  if (output !== undefined) result.output = output;
  return result;
}
function done(tool, output, warnings = []) {
  return {ok:true,status:'COMPLETED',tool,version:1,output,warnings,provenance:{execution:'local',networkUsed:false}};
}
function esc(value) {
  return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function xml(value) { return esc(value); }
function parseHex(value) {
  let s=String(value || '').trim();
  if (/^#[0-9a-f]{3}$/i.test(s)) s='#'+s[1]+s[1]+s[2]+s[2]+s[3]+s[3];
  if (!/^#[0-9a-f]{6}$/i.test(s)) throw new ToolFailure('INVALID_INPUT','Color must be a six-digit HEX value such as #336699.');
  return {hex:s.toLowerCase(),r:parseInt(s.slice(1,3),16),g:parseInt(s.slice(3,5),16),b:parseInt(s.slice(5,7),16)};
}
function validWebUrl(raw) {
  let url;
  try { url = new URL(String(raw || '')); } catch { throw new ToolFailure('INVALID_INPUT','An absolute HTTP or HTTPS URL is required.'); }
  if (!['http:','https:'].includes(url.protocol) || !url.hostname || url.username || url.password) {
    throw new ToolFailure('INVALID_INPUT','Only absolute HTTP(S) URLs without embedded credentials are allowed.');
  }
  return url;
}
function blockedHost(host) {
  let h=String(host || '').toLowerCase().replace(/^\[|\]$/g,'').replace(/\.$/,'');
  if (!h || h==='localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal') || h.endsWith('.test') || h.endsWith('.invalid') || !h.includes('.')) return true;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) {
    const p=h.split('.').map(Number);
    if (p.some(n=>n<0||n>255)) return true;
    return p[0]===0 || p[0]===10 || p[0]===127 || p[0]>=224 ||
      (p[0]===169&&p[1]===254) || (p[0]===172&&p[1]>=16&&p[1]<=31) ||
      (p[0]===192&&p[1]===168) || (p[0]===100&&p[1]>=64&&p[1]<=127) ||
      (p[0]===192&&p[1]===0) || (p[0]===198&&(p[1]===18||p[1]===19)) ||
      (p[0]===198&&p[1]===51&&p[2]===100) || (p[0]===203&&p[1]===0&&p[2]===113);
  }
  if (h.includes(':')) {
    return h==='::' || h==='::1' || /^f[cd]/i.test(h) || /^fe[89ab]/i.test(h) ||
      /^ff/i.test(h) || /^2001:db8:/i.test(h) || /^::ffff:(127\.|10\.|192\.168\.)/i.test(h);
  }
  return false;
}
function metaContent(html, key, attribute) {
  const tags=String(html).match(/<meta\b[^>]*>/gi)||[];
  for(const tag of tags) {
    const wanted=attribute==='property' ? tag.match(/\bproperty\s*=\s*(["'])(.*?)\1/i) : tag.match(/\bname\s*=\s*(["'])(.*?)\1/i);
    if(wanted && wanted[2].toLowerCase()===key.toLowerCase()) {
      const content=tag.match(/\bcontent\s*=\s*(["'])(.*?)\1/i);
      return content?content[2]:'';
    }
  }
  return '';
}
function textLength(s) { return String(s || '').replace(/\s+/g,' ').trim().length; }
function staticSeoAudit(html) {
  const source=String(html || '');
  if(source.length>1000000) throw new ToolFailure('INPUT_TOO_LARGE','HTML input exceeds 1 MB.');
  const title=(source.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)||[])[1]||'';
  const description=metaContent(source,'description','name');
  const h1=(source.match(/<h1\b/gi)||[]).length;
  const images=source.match(/<img\b[^>]*>/gi)||[];
  const findings=[];
  const add=(code,severity,message)=>findings.push({code,severity,message});
  if(!textLength(title)) add('title_missing','error','Add a meaningful page title.');
  else if(textLength(title)>60) add('title_too_long','warning','Keep the title concise; search snippets may truncate it.');
  if(!textLength(description)) add('description_missing','error','Add a descriptive meta description.');
  else if(textLength(description)>160) add('description_too_long','warning','Shorten the meta description to avoid truncation.');
  if(!/<link\b[^>]*\brel\s*=\s*["']canonical["']/i.test(source)) add('canonical_missing','warning','Add a canonical URL when this page has a preferred indexable URL.');
  if(h1===0) add('h1_missing','warning','Use one descriptive primary heading.');
  if(h1>1) add('multiple_h1','warning','Review whether more than one primary heading is intentional.');
  if(!/\bname\s*=\s*["']viewport["']/i.test(source)) add('viewport_missing','warning','Add the responsive viewport meta tag.');
  let missingAlt=0;
  for(const tag of images) if(!/\balt\s*=/i.test(tag)) missingAlt++;
  if(missingAlt) add('image_alt_missing','error',missingAlt+' image(s) have no alt attribute.');
  if(/<meta\b[^>]*\bname\s*=\s*["']robots["'][^>]*\bcontent\s*=\s*["'][^"']*noindex/i.test(source)) add('noindex_present','warning','The page includes a noindex directive.');
  const emptyLinks=(source.match(/<a\b[^>]*>\s*(?:<svg\b[\s\S]*?<\/svg>\s*)?<\/a>/gi)||[]).length;
  if(emptyLinks) add('link_name_missing','warning',emptyLinks+' link(s) appear to lack text; verify accessible names.');
  const deductions={error:20,warning:8,info:2};
  const score=Math.max(0,100-findings.reduce((sum,f)=>sum+(deductions[f.severity]||0),0));
  return {score,findings,summary:{title:textLength(title)?textLength(title):0,description:textLength(description),h1Count:h1,imageCount:images.length,imagesMissingAlt:missingAlt},scope:'Static HTML inspection only; no URL was fetched.'};
}
function staticAccessibilityAudit(html) {
  const source=String(html || '');
  if(source.length>1000000) throw new ToolFailure('INPUT_TOO_LARGE','HTML input exceeds 1 MB.');
  const findings=[];
  const add=(code,severity,message)=>findings.push({code,severity,message});
  if(!/<html\b[^>]*\blang\s*=\s*["'][^"']+["']/i.test(source)) add('document_lang_missing','error','Set the document language on the html element.');
  if(!/\bname\s*=\s*["']viewport["']/i.test(source)) add('viewport_missing','warning','Add a viewport meta tag for responsive layout.');
  const ids=new Set(Array.from(source.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi),m=>m[1]));
  const labels=new Set(Array.from(source.matchAll(/<label\b[^>]*\bfor\s*=\s*["']([^"']+)["']/gi),m=>m[1]));
  const images=source.match(/<img\b[^>]*>/gi)||[];
  for(const tag of images) if(!/\balt\s*=/i.test(tag)) add('image_alt_missing','error','An image has no alt attribute.');
  const buttons=source.match(/<button\b[^>]*>[\s\S]*?<\/button>/gi)||[];
  for(const tag of buttons) {
    const name=tag.match(/\b(?:aria-label|title)\s*=\s*["']([^"']+)["']/i);
    const inner=tag.replace(/^<button\b[^>]*>/i,'').replace(/<\/button>$/i,'').replace(/<[^>]+>/g,'').replace(/&nbsp;|&#160;/gi,' ').trim();
    if(!(name&&textLength(name[1]))&&!textLength(inner)) add('button_name_missing','error','A button has no detectable accessible name.');
  }
  const controls=source.match(/<(?:input|select|textarea)\b[^>]*>/gi)||[];
  for(const tag of controls) {
    if(/\btype\s*=\s*["']hidden["']/i.test(tag)) continue;
    const id=(tag.match(/\bid\s*=\s*["']([^"']+)["']/i)||[])[1];
    const name=tag.match(/\b(?:aria-label|title)\s*=\s*["']([^"']+)["']/i);
    if(!(name&&textLength(name[1]))&&!(id&&labels.has(id))) add('form_control_label_missing','error','A form control has no associated label or explicit accessible name.');
  }
  const headings=Array.from(source.matchAll(/<h([1-6])\b/gi),m=>Number(m[1]));
  for(let i=1;i<headings.length;i++) if(headings[i]>headings[i-1]+1) {add('heading_order_skip','warning','Heading levels skip from h'+headings[i-1]+' to h'+headings[i]+'.');break;}
  const score=Math.max(0,100-findings.reduce((sum,f)=>sum+(f.severity==='error'?18:7),0));
  return {score,findings,summary:{images:images.length,controls:controls.length,buttons:buttons.length,headingCount:headings.length,knownIds:ids.size},scope:'Static HTML checks only; use browser and assistive-technology testing before release.'};
}
function performanceAudit(metrics) {
  if(!metrics || typeof metrics!=='object' || !Object.keys(metrics).length) throw new ToolFailure('NEEDS_BROWSER_METRICS','Supply measured browser or Lighthouse metrics; no performance values are fabricated.');
  const keys=['lcpMs','inpMs','cls','ttfbMs','totalBytes','jsBytes','imageBytes','blockingRequests'];
  const clean={};
  for(const key of keys) if(metrics[key]!==undefined) {
    const v=Number(metrics[key]);
    if(!Number.isFinite(v)||v<0) throw new ToolFailure('INVALID_INPUT','Metric '+key+' must be a finite non-negative number.');
    clean[key]=v;
  }
  const findings=[];
  let score=100;
  const flag=(code,points,message)=>{findings.push({code,severity:'warning',message});score-=points;};
  if(clean.lcpMs>4000) flag('lcp_poor',25,'Largest Contentful Paint exceeds 4 seconds.');
  else if(clean.lcpMs>2500) flag('lcp_needs_improvement',15,'Largest Contentful Paint exceeds 2.5 seconds.');
  if(clean.inpMs>500) flag('inp_poor',20,'Interaction to Next Paint exceeds 500 ms.');
  else if(clean.inpMs>200) flag('inp_needs_improvement',10,'Interaction to Next Paint exceeds 200 ms.');
  if(clean.cls>0.25) flag('cls_poor',25,'Cumulative Layout Shift exceeds 0.25.');
  else if(clean.cls>0.1) flag('cls_needs_improvement',15,'Cumulative Layout Shift exceeds 0.1.');
  if(clean.ttfbMs>800) flag('ttfb_high',15,'Time to First Byte exceeds 800 ms.');
  if(clean.totalBytes>2000000) flag('page_heavy',10,'Transferred page bytes exceed 2 MB.');
  if(clean.jsBytes>600000) flag('javascript_heavy',10,'JavaScript bytes exceed 600 KB.');
  if(clean.imageBytes>1500000) flag('images_heavy',10,'Image bytes exceed 1.5 MB.');
  if(!findings.length) findings.push({code:'metrics_within_thresholds',severity:'info',message:'Supplied metrics meet the configured baseline thresholds.'});
  return {score:Math.max(0,score),findings,metrics:clean,scope:'Threshold assessment of supplied metrics, not a browser measurement.'};
}
function jsonInput(input) {
  if(typeof input.json==='string') { try{return JSON.parse(input.json);} catch {throw new ToolFailure('INVALID_INPUT','The JSON input is invalid.');} }
  if(input.json!==undefined) return input.json;
  if(typeof input.text==='string') { try{return JSON.parse(input.text);} catch {throw new ToolFailure('INVALID_INPUT','The JSON input is invalid.');} }
  throw new ToolFailure('INVALID_INPUT','Provide JSON text or a JSON value.');
}
function typeName(value) {
  let name=String(value||'Root').replace(/[^a-zA-Z0-9_$]+/g,' ').trim().split(/\s+/).map(p=>p.charAt(0).toUpperCase()+p.slice(1)).join('');
  if(!name) name='Root';
  if(/^\d/.test(name)) name='T'+name;
  return name;
}
function toTypescript(value, rootName) {
  const declarations=[];
  const seen=new Set();
  function infer(v,name,depth) {
    if(depth>12) return 'unknown';
    if(v===null) return 'null';
    if(Array.isArray(v)) {
      if(!v.length) return 'unknown[]';
      const values=Array.from(new Set(v.map((item,index)=>infer(item,typeName(name)+'Item',depth+1))));
      return (values.length>1?'('+values.join(' | ')+')':values[0])+'[]';
    }
    if(typeof v==='object') {
      const n=typeName(name);
      if(!seen.has(n)) {
        seen.add(n);
        const fields=[];
        for(const [key,child] of Object.entries(v).slice(0,200)) {
          const prop=/^[a-zA-Z_$][\w$]*$/.test(key)?key:JSON.stringify(key);
          fields.push('  '+prop+': '+infer(child,n+typeName(key),depth+1)+';');
        }
        declarations.push('export interface '+n+' {\n'+fields.join('\n')+'\n}');
      }
      return n;
    }
    if(typeof v==='string') return 'string';
    if(typeof v==='number') return 'number';
    if(typeof v==='boolean') return 'boolean';
    return 'unknown';
  }
  infer(value,rootName,0);
  return declarations.join('\n\n');
}
function generateMeta(input) {
  const title=String(input.title||'').trim().slice(0,200);
  const description=String(input.description||'').trim().slice(0,500);
  if(!title||!description) throw new ToolFailure('INVALID_INPUT','Title and description are required.');
  const tags=['<title>'+esc(title)+'</title>','<meta name="description" content="'+esc(description)+'">'];
  if(input.url) tags.push('<link rel="canonical" href="'+esc(validWebUrl(input.url).href)+'">');
  return {title,description,html:tags.join('\n')};
}
function generateSitemap(input) {
  if(!Array.isArray(input.urls)||input.urls.length<1||input.urls.length>5000) throw new ToolFailure('INVALID_INPUT','Provide between 1 and 5,000 URLs.');
  const unique=new Set();
  for(const raw of input.urls) {
    const url=validWebUrl(raw); url.hash='';
    unique.add(url.href);
  }
  const body=Array.from(unique).map(url=>'<url><loc>'+xml(url)+'</loc></url>').join('');
  return {xml:'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+body+'</urlset>',urlCount:unique.size};
}
function generateRobots(input) {
  const cleanPath=(v)=>{const p=String(v||'').trim();if(!p)return '';if(!p.startsWith('/')||/[\r\n]/.test(p)||p.length>500) throw new ToolFailure('INVALID_INPUT','Robots paths must start with / and contain no newlines.');return p;};
  const lines=['User-agent: '+String(input.userAgent||'*').replace(/[\r\n]/g,'').slice(0,80)];
  for(const p of (Array.isArray(input.allow)?input.allow:[]).slice(0,200)) { const v=cleanPath(p);if(v)lines.push('Allow: '+v); }
  for(const p of (Array.isArray(input.disallow)?input.disallow:[]).slice(0,200)) { const v=cleanPath(p);if(v)lines.push('Disallow: '+v); }
  if(input.sitemap) lines.push('Sitemap: '+validWebUrl(input.sitemap).href);
  return {text:lines.join('\n')+'\n'};
}
function generateFavicon(input) {
  const bg=parseHex(input.background||'#111827').hex;
  const fg=parseHex(input.foreground||'#ffffff').hex;
  const text=String(input.text||'B').trim().slice(0,32)||'B';
  return {svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="'+bg+'"/><text x="32" y="42" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" font-weight="700" fill="'+fg+'">'+esc(text)+'</text></svg>'};
}
function generateOg(input) {
  const url=validWebUrl(input.url).href;
  const title=String(input.title||'').trim().slice(0,200);
  const description=String(input.description||'').trim().slice(0,500);
  if(!title||!description) throw new ToolFailure('INVALID_INPUT','Title and description are required.');
  const image=input.image?validWebUrl(input.image).href:'';
  const rows=[
    {attribute:'property',key:'og:type',value:'website'},
    {attribute:'property',key:'og:title',value:title},
    {attribute:'property',key:'og:description',value:description},
    {attribute:'property',key:'og:url',value:url},
    {attribute:'name',key:'twitter:card',value:'summary_large_image'},
    {attribute:'name',key:'twitter:title',value:title},
    {attribute:'name',key:'twitter:description',value:description}
  ];
  if(image) {
    rows.push({attribute:'property',key:'og:image',value:image});
    rows.push({attribute:'name',key:'twitter:image',value:image});
  }
  return {
    url,title,description,
    html:rows.map(row=>'<meta '+row.attribute+'="'+esc(row.key)+'" content="'+esc(row.value)+'">').join('\n'),
    tags:Object.fromEntries(rows.map(row=>[row.key,row.value]))
  };
}
function cssColor(input) { return parseHex(input).hex; }
function colorPalette(input) {
  const color=parseHex(input.color);
  const blend=(target,amount)=>'#'+[color.r,color.g,color.b].map((v)=>Math.round(v+(target-v)*amount).toString(16).padStart(2,'0')).join('');
  const darken=(amount)=>'#'+[color.r,color.g,color.b].map(v=>Math.round(v*(1-amount)).toString(16).padStart(2,'0')).join('');
  const r=color.r,g=color.g,b=color.b;
  const complementary='#'+[255-r,255-g,255-b].map(v=>v.toString(16).padStart(2,'0')).join('');
  const colors=[blend(255,0.8),blend(255,0.55),blend(255,0.3),color.hex,darken(0.2),darken(0.4),complementary];
  return {base:color.hex,colors:colors.map((hex,index)=>({name:['lightest','light','soft','base','dark','darkest','complement'][index],hex}))};
}
function cssGradient(input) {
  const colors=input.colors;
  if(!Array.isArray(colors)||colors.length<2||colors.length>8) throw new ToolFailure('INVALID_INPUT','Provide between 2 and 8 HEX color stops.');
  const normalized=colors.map(cssColor);
  const angle=input.angle===undefined?135:Number(input.angle);
  if(!Number.isInteger(angle)||angle<0||angle>360) throw new ToolFailure('INVALID_INPUT','Gradient angle must be an integer from 0 to 360.');
  let stops=Array.isArray(input.stops)?input.stops.map(Number):normalized.map((_,i)=>Math.round(i*100/(normalized.length-1)));
  if(stops.length!==normalized.length||stops.some(v=>!Number.isInteger(v)||v<0||v>100)) throw new ToolFailure('INVALID_INPUT','Every stop must be an integer percentage from 0 to 100.');
  for(let i=1;i<stops.length;i++) if(stops[i]<stops[i-1]) throw new ToolFailure('INVALID_INPUT','Color stop positions must be ordered.');
  return {css:'linear-gradient('+angle+'deg, '+normalized.map((c,i)=>c+' '+stops[i]+'%').join(', ')+')',colors:normalized,angle,stops};
}
function regexTest(input) {
  const pattern=String(input.pattern||'');
  const sample=String(input.input||'');
  const flags=String(input.flags||'');
  if(pattern.length>256||sample.length>4000) throw new ToolFailure('INPUT_TOO_LARGE','Pattern is limited to 256 characters and test input to 4,000 characters.');
  if(!/^[gimsu]*$/.test(flags)||new Set(flags).size!==flags.length) throw new ToolFailure('INVALID_INPUT','Only unique g, i, m, s and u flags are supported.');
  const nested=/\([^)]*[+*{][^)]*\)[+*{]/.test(pattern);
  const repeatedAlt=/\([^)]*\|[^)]*\)[+*{]/.test(pattern);
  const backref=/\\[1-9]|\\k</.test(pattern);
  if(nested||repeatedAlt||backref) throw new ToolFailure('BLOCKED','This regex uses a pattern shape rejected by the conservative safety profile.');
  let re;
  try { re=new RegExp(pattern,flags.includes('g')?flags:flags+'g'); }
  catch { throw new ToolFailure('INVALID_INPUT','Invalid regular expression or flags.'); }
  const matches=[];
  let match;
  while((match=re.exec(sample))!==null&&matches.length<100) {
    matches.push({match:match[0],index:match.index,end:match.index+match[0].length,groups:match.slice(1)});
    if(match[0]==='') re.lastIndex++;
  }
  return {pattern,flags,matches,matchCount:matches.length,truncated:matches.length===100};
}
function inspectJwt(input) {
  const token=String(input.token||'');
  const parts=token.split('.');
  if(parts.length!==3) throw new ToolFailure('INVALID_INPUT','A compact JWT must contain three dot-separated segments.');
  const decode=(part)=>{try{return JSON.parse(Buffer.from(part,'base64url').toString('utf8'));}catch{throw new ToolFailure('INVALID_INPUT','JWT header or payload is not valid Base64URL JSON.');}};
  return {header:decode(parts[0]),payload:decode(parts[1]),signaturePresent:parts[2].length>0,signatureVerified:false,algorithm:String(decode(parts[0]).alg||'unknown')};
}
function encoding(input) {
  const value=String(input.value ?? '');
  const op=String(input.operation||'');
  if(op==='base64-encode') return {value:Buffer.from(value,'utf8').toString('base64')};
  if(op==='base64-decode') {
    if(!/^[A-Za-z0-9+/_-]*={0,2}$/.test(value)||value.length%4===1) throw new ToolFailure('INVALID_INPUT','Invalid Base64 input.');
    return {value:Buffer.from(value.replace(/-/g,'+').replace(/_/g,'/'),'base64').toString('utf8')};
  }
  if(op==='binary-encode') return {value:Array.from(Buffer.from(value,'utf8'),byte=>byte.toString(2).padStart(8,'0')).join(' ')};
  if(op==='binary-decode') {
    const s=value.trim();
    if(s&&!/^[01]{8}(?:\s+[01]{8})*$/.test(s)) throw new ToolFailure('INVALID_INPUT','Binary text must use whitespace-separated 8-bit groups.');
    return {value:Buffer.from(s?s.split(/\s+/).map(byte=>parseInt(byte,2)):[]).toString('utf8')};
  }
  throw new ToolFailure('INVALID_INPUT','Choose base64-encode, base64-decode, binary-encode or binary-decode.');
}
function apiPlan(input) {
  const url=validWebUrl(input.url);
  if(blockedHost(url.hostname)) throw new ToolFailure('BLOCKED','Private, local, reserved or ambiguous destinations are blocked.');
  const method=String(input.method||'GET').toUpperCase();
  if(!['GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS'].includes(method)) throw new ToolFailure('INVALID_INPUT','Unsupported HTTP method.');
  const headers=input.headers&&typeof input.headers==='object'?input.headers:{};
  return {ok:false,status:'NOT_CONFIGURED',tool:'api.test',error:'No governed outbound HTTP adapter is configured; no request was sent.',networkUsed:false,output:{request:{url:url.origin+url.pathname,method,headerNames:Object.keys(headers).slice(0,50),queryParameterNames:Array.from(url.searchParams.keys()).slice(0,50),hasBody:input.body!==undefined},nextStep:'Configure a dedicated SSRF-safe network runner, credential policy, timeout and explicit user confirmation before sending requests.'}};
}

export async function runTool(id, input = {}) {
  const contract=getToolContract(id);
  if(!contract) return fail('UNKNOWN_TOOL',String(id||''),'Unknown Tool Fabric id.');
  let bytes=0;
  try { bytes=Buffer.byteLength(JSON.stringify(input ?? {}),'utf8'); }
  catch { return fail('INVALID_INPUT',contract.id,'Input must be JSON-compatible.'); }
  if(bytes>1000000) return fail('INPUT_TOO_LARGE',contract.id,'Input exceeds the 1 MB safety limit.');
  if(!input||typeof input!=='object'||Array.isArray(input)) return fail('INVALID_INPUT',contract.id,'Input must be an object.');
  if(contract.executionMode==='browser') return fail('BROWSER_REQUIRED',contract.id,'This tool requires its explicit browser-local adapter; no server-side success is simulated.');
  if(contract.id==='api.test') {
    try { const plan=apiPlan(input);return plan; }
    catch(error) { return fail(error.status||'INVALID_INPUT',contract.id,error.message); }
  }
  if(contract.id==='web.performance.audit') {
    try { return done(contract.id,performanceAudit(input.metrics)); }
    catch(error) { return fail(error.status||'INVALID_INPUT',contract.id,error.message); }
  }
  try {
    let output,warnings=[];
    switch(contract.id) {
      case 'seo.meta.generate': output=generateMeta(input);break;
      case 'seo.sitemap.generate': output=generateSitemap(input);break;
      case 'seo.robots.generate': output=generateRobots(input);break;
      case 'design.favicon.generate': output=generateFavicon(input);break;
      case 'seo.og.generate': output=generateOg(input);break;
      case 'seo.audit': output=staticSeoAudit(input.html);break;
      case 'web.accessibility.audit': output=staticAccessibilityAudit(input.html);break;
      case 'json.format': {
        if(typeof input.text!=='string') throw new ToolFailure('INVALID_INPUT','JSON text is required.');
        let value;try{value=JSON.parse(input.text);}catch{throw new ToolFailure('INVALID_INPUT','The JSON input is invalid.');}
        output={formatted:JSON.stringify(value,null,2),valid:true};break;
      }
      case 'json.typescript': {
        const value=jsonInput(input);
        output={typescript:toTypescript(value,input.rootName||'Root')};break;
      }
      case 'regex.test': output=regexTest(input);break;
      case 'jwt.inspect': {
        output=inspectJwt(input);
        warnings.push('JWT header and payload are decoded only. The signature was not verified.');
        break;
      }
      case 'encoding.base64-binary': output=encoding(input);break;
      case 'design.color.palette': output=colorPalette(input);break;
      case 'design.css.gradient': output=cssGradient(input);break;
      case 'qr.generate': output={svg:generateQrSvg(String(input.text||'')),format:'svg',errorCorrection:'L'};break;
      default: return fail('NOT_CONFIGURED',contract.id,'No executor is configured for this contract.');
    }
    return done(contract.id,output,warnings);
  } catch(error) {
    return fail(error.status||'INVALID_INPUT',contract.id,error.message||'Tool execution failed.');
  }
}

export {TOOL_CONTRACTS, getToolContract, listToolContracts};
