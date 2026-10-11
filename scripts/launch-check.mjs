import {listPublicSeoPages} from '../src/seo/public-pages.js';
const base=(process.env.CODINGVIBES_URL||'http://127.0.0.1:4400').replace(/\/$/,'');
const checks=[
  ['/health','application/json'],
  ['/ready','application/json'],
  ['/','text/html'],
  ['/app','text/html'],
  ['/terms','text/html'],
  ['/privacy','text/html'],
  ['/robots.txt','text/plain'],
  ['/sitemap.xml','application/xml'],
  ['/llms.txt','text/plain'],
  ...listPublicSeoPages().map(page=>[page.path,'text/html'])
];
const failures=[];
for(const [path,type] of checks){
  const r=await fetch(base+path,{redirect:'manual'});
  const body=await r.text();
  if(r.status<200||r.status>=400) failures.push(path+':http_'+r.status);
  const contentType=String(r.headers.get('content-type')||'');
  const expected=type==='application/xml'?'xml':type.split('/')[1];
  if(!contentType.includes(expected)) failures.push(path+':content_type');
  if(path==='/' && !/<title>[^<]*Build Vibe/i.test(body)) failures.push('/missing_title');
  if(path.startsWith('/ai-')||path.endsWith('-builder')||['/features','/templates','/pricing','/how-it-works','/faq'].includes(path)){if(!/<meta[^>]+name=["']description["'][^>]+content=["'][^"']{70,160}["']/i.test(body)) failures.push(path+':missing_description');if(!/<link[^>]+rel=["']canonical["'][^>]+href=["']https?:\/\//i.test(body)) failures.push(path+':missing_absolute_canonical');if(!/<h1\b/i.test(body)) failures.push(path+':missing_h1');}
  if(path==='/robots.txt' && !body.includes('Sitemap:')) failures.push('/robots_missing_sitemap');
  if(path==='/sitemap.xml' && !body.includes('<urlset')) failures.push('/sitemap_invalid');
  if(path==='/llms.txt' && !body.startsWith('# Build Vibe')) failures.push('/llms_invalid');
  if(path==='/sitemap.xml'){for(const page of listPublicSeoPages())if(!body.includes('<loc>'+base+page.path+'</loc>'))failures.push('/sitemap_missing_'+page.path.replaceAll('/','_'));}
}
// Verify the operational endpoints and correlation/security boundaries, not just their MIME types.
const healthResponse=await fetch(base+'/health',{redirect:'manual',signal:AbortSignal.timeout(5000)});
const health=await healthResponse.json().catch(()=>null);
if(healthResponse.status!==200)failures.push('/health:status');
if(!health||health.ok!==true||health.service!=='build-vibe'||typeof health.version!=='string')failures.push('/health:payload');
if(!health||Number.isNaN(Date.parse(health.time)))failures.push('/health:timestamp');
if(!String(healthResponse.headers.get('x-request-id')||'').trim())failures.push('/health:request_id_missing');
if(!String(healthResponse.headers.get('cache-control')||'').includes('no-store'))failures.push('/health:cache_control');
const readyResponse=await fetch(base+'/ready',{redirect:'manual',signal:AbortSignal.timeout(5000)});
const ready=await readyResponse.json().catch(()=>null);
if(readyResponse.status!==200)failures.push('/ready:not_ready');
if(!ready||ready.ok!==true||ready.ready!==true&&ready.status!=='ready')failures.push('/ready:payload');
if(!String(readyResponse.headers.get('x-request-id')||'').trim())failures.push('/ready:request_id_missing');
for(const pathname of ['/api/ops/metrics','/api/launch/status']){
  try{
    const response=await fetch(base+pathname,{headers:{accept:'application/json'},redirect:'manual',signal:AbortSignal.timeout(5000)});
    const payload=await response.json().catch(()=>null);
    if(response.status!==403)failures.push(pathname+':admin_route_not_protected');
    if(!payload||payload.ok!==false||!String(payload.error||'').trim())failures.push(pathname+':auth_error_shape');
  }catch{
    failures.push(pathname+':probe_failed');
  }
}
if(failures.length){console.error('Build Vibe launch check failed:');for(const x of failures)console.error('- '+x);process.exit(2);}
console.log(JSON.stringify({ok:true,base,checks:checks.length,operations:{health:'PASS',ready:'PASS',metricsAdminProtection:'PASS',launchStatusAdminProtection:'PASS'}},null,2));
