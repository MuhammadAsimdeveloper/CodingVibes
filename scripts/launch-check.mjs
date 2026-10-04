const base=(process.env.CODINGVIBES_URL||'http://127.0.0.1:4400').replace(/\/$/,'');
const checks=[
  ['/health','application/json'],
  ['/ready','application/json'],
  ['/','text/html'],
  ['/app','text/html'],
  ['/terms','text/html'],
  ['/privacy','text/html'],
  ['/robots.txt','text/plain'],
  ['/sitemap.xml','application/xml']
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
  if(path==='/robots.txt' && !body.includes('Sitemap:')) failures.push('/robots_missing_sitemap');
  if(path==='/sitemap.xml' && !body.includes('<urlset')) failures.push('/sitemap_invalid');
}
if(failures.length){console.error('Build Vibe launch check failed:');for(const x of failures)console.error('- '+x);process.exit(2);}
console.log(JSON.stringify({ok:true,base,checks:checks.length},null,2));
