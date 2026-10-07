import fs from 'node:fs';
import path from 'node:path';

const BASE_STATES=['loading','empty','error','success'];
const BASE_FEATURES=[
  'responsive UI',
  'accessible navigation and forms',
  'reduced-motion support',
  'SEO metadata and canonical URL',
  'local assets/runtime',
  'local content/data editing',
  'owner admin surface'
];

function walk(root,out=[]){
  if(!fs.existsSync(root)||out.length>800)return out;
  for(const e of fs.readdirSync(root,{withFileTypes:true})){
    if(['.git','node_modules','.codingvibes'].includes(e.name))continue;
    const p=path.join(root,e.name);
    if(e.isDirectory())walk(p,out);
    else if(/\.(html|css|js|jsx|ts|tsx|json|md|svg|webmanifest)$/i.test(e.name))out.push(p);
  }
  return out;
}
function textOf(files){let s='';for(const f of files){try{s+=fs.readFileSync(f,'utf8')+'\\n'}catch{}}return s.slice(0,1400000);}
function htmlFiles(files){return files.filter(x=>x.toLowerCase().endsWith('.html'));}
function htmlText(files){return htmlFiles(files).map(f=>{try{return fs.readFileSync(f,'utf8')}catch{return''}}).join('\\n');}
function hasAny(s,arr){const lower=String(s||'').toLowerCase();return arr.some(x=>lower.includes(String(x).toLowerCase()));}
function unique(a){return [...new Set(a)];}

function surfaceDefaults(kind='business',behavior={}){
  const surfaces=['/','/privacy','/terms','/contact'];
  if(['business','local','agency','portfolio','hospitality','realEstate','education','event','content'].includes(kind))surfaces.push('/about');
  if(['portfolio','agency'].includes(kind))surfaces.push('/work');
  if(kind==='realEstate')surfaces.push('/properties');
  if(kind==='hospitality')surfaces.push('/booking','/calendar');
  if(kind==='education')surfaces.push('/courses');
  if(kind==='content')surfaces.push('/blog');
  if(kind==='event')surfaces.push('/schedule');
  if(['ecommerce','marketplace'].includes(kind))surfaces.push('/shop','/collections','/cart','/checkout','/account');
  if(kind==='marketplace')surfaces.push('/vendors');
  if(behavior?.authentication||behavior?.publicLogin)surfaces.push('/login','/signup');
  if(behavior?.payments)surfaces.push('/checkout');
  return unique(surfaces);
}

export function buildQualityContract(spec={}){
  const kind=String(spec.siteKind||spec.contentModel?.kit||'business');
  const behavior=spec.behavior||{};
  const requiredSurfaces=unique([...(Array.isArray(spec.pages)?spec.pages:[]),...surfaceDefaults(kind,behavior)]);
  const requiredStates=[...BASE_STATES];
  const requiredFeatures=[...BASE_FEATURES];
  if(behavior.search)requiredFeatures.push('search and filtering');
  if(behavior.catalog)requiredFeatures.push('catalog/product states');
  if(behavior.booking)requiredFeatures.push('booking/availability states');
  if(behavior.cms)requiredFeatures.push('draft/publish content workflow');
  if(behavior.realtime)requiredFeatures.push('realtime fallback');
  if(behavior.offline)requiredFeatures.push('offline/PWA fallback');
  if(behavior.notifications)requiredFeatures.push('notification permission/failure states');
  if(behavior.files)requiredFeatures.push('upload/download progress and failure states');
  if(behavior.camera)requiredFeatures.push('camera permission/error fallback');
  if(behavior.location)requiredFeatures.push('location permission/error fallback');
  if(spec.experience?.threeD)requiredFeatures.push('WebGL fallback','user-controlled immersive interactions');
  if(behavior.payments)requiredFeatures.push('provider-neutral checkout boundary');
  if(behavior.authentication)requiredFeatures.push('provider-neutral local authentication boundary');
  return {
    version:'quality-contract.v2',
    minimumScore:90,
    providerIndependent:true,
    requiredSurfaces,
    requiredStates,
    requiredFeatures:unique(requiredFeatures),
    hardRules:[
      'No remote script or stylesheet is required for core runtime',
      'Core interactions remain usable when optional effects fail',
      'Forms expose programmatic labels and errors',
      'Images have meaningful alt text unless decorative',
      'Public pages expose semantic metadata',
      'Responsive and reduced-motion behavior are explicit'
    ]
  };
}

function publicRoutes(files){
  const routes=new Set(['/']);
  for(const f of htmlFiles(files)){
    const rel=f.replace(/\\\\/g,'/').split('/public/').pop()||'';
    if(rel==='index.html')routes.add('/');
    else if(rel.endsWith('.html'))routes.add('/'+rel.slice(0,-5));
  }
  return routes;
}

function linkIntegrity(html,spec,files){
  const routeSet=publicRoutes(files);
  const declared=new Set(Array.isArray(spec.pages)?spec.pages:['/']);
  const broken=[];
  for(const m of html.matchAll(/(?:href|data-route)=["'](\\/[^"'#?]*)/gi)){
    const route=m[1].replace(/\/+$/,'')||'/';
    if(route.startsWith('/api/')||route.startsWith('/admin')||route.startsWith('/assets/')||route.startsWith('/_'))continue;
    if(!declared.has(route)&&!routeSet.has(route))broken.push(route);
  }
  return unique(broken);
}

function importCount(source){
  const matches=String(source||'').match(/@import\\s+(?:url\\()?["']?https?:\\/\\//gi);
  return matches?.length||0;
}

export function auditProductExperience(workspace,spec={}){
  const files=walk(path.resolve(workspace));
  const names=files.map(x=>path.relative(workspace,x).replaceAll(path.sep,'/').toLowerCase());
  const source=textOf(files);
  const html=htmlText(files);
  const contract=buildQualityContract(spec);
  const checks=[];
  const addCheck=(id,label,ok,blocking=false,detail='')=>checks.push({id,label,passed:Boolean(ok),blocking:Boolean(blocking&&!ok),detail});
  const entry=names.some(x=>x==='public/index.html'||x==='index.html');
  addCheck('core_entrypoint','core entrypoint',entry,true);
  addCheck('semantic_structure','semantic HTML structure',/<html\\b[^>]*\\blang=["'][^"']+["'][^>]*>/i.test(html)&&/<main\\b/i.test(html)&&/<nav\\b/i.test(html),true);
  addCheck('responsive_layout','responsive layout',/(<meta[^>]+name=["']viewport["']|@media|clamp\\()/i.test(source),true);
  addCheck('accessible_focus','visible keyboard focus',/focus-visible|:focus\\s*\\{|aria-|role=/i.test(source),true);
  addCheck('reduced_motion','reduced-motion support',/prefers-reduced-motion|reducedMotion/i.test(source),true);
  addCheck('metadata','route metadata',/<meta[^>]+name=["']description["']/i.test(html)&&/<link[^>]+rel=["']canonical["']/i.test(html)&&/<meta[^>]+property=["']og:/i.test(html),false);
  addCheck('semantic_navigation','semantic navigation',/<nav\\b/i.test(html)&&/<a\\b[^>]+href=/i.test(html),false);
  addCheck('interaction_states','interaction states',/(hover|:active|:focus|loading|empty|error|success|disabled|aria-busy)/i.test(source),false);
  const labelFor=new Set([...html.matchAll(/<label\\b[^>]*\\bfor=["']([^"']+)["'][^>]*>/gi)].map(m=>m[1]));
  const formControls=[...html.matchAll(/<(input|select|textarea)\\b([^>]*)>/gi)].filter(m=>!(/\\btype\\s*=\\s*["']hidden["']/i.test(m[2])));
  const labelFailures=formControls.filter(m=>{
    const attrs=m[2];
    if(/\\baria-label\\s*=/i.test(attrs)||/\\baria-labelledby\\s*=/i.test(attrs))return false;
    const id=(attrs.match(/\\bid\\s*=\\s*["']([^"']+)["']/i)||[])[1];
    return !id||!labelFor.has(id);
  });
  addCheck('form_labels','form control labels',labelFailures.length===0,true,labelFailures.length?String(labelFailures.length):'');
  const imageFailures=[...html.matchAll(/<img\\b([^>]*)>/gi)].filter(m=>!(/\\balt\\s*=\\s*["'][^"']*["']/i.test(m[1])||/\\brole\\s*=\\s*["']presentation["']/i.test(m[1])));
  addCheck('image_alt','image alternative text',imageFailures.length===0,true,imageFailures.length?String(imageFailures.length):'');
  const remoteRuntime=[...source.matchAll(/<(?:script|link)\\b[^>]*(?:src|href)=["']https?:\\/\\/[^"']+["'][^>]*>/gi)];
  addCheck('local_runtime','provider-independent runtime',remoteRuntime.length===0&&importCount(source)===0,true,remoteRuntime.length?String(remoteRuntime.length):'');
  addCheck('launch_surfaces','launch surfaces',hasAny(source,['contact','privacy','terms','sitemap','robots']),false);
  addCheck('placeholder_content','no obvious placeholder copy',!/(lorem ipsum|todo:|coming soon|replace this text)/i.test(html),false);
  const brokenLinks=linkIntegrity(html,spec,files);
  addCheck('internal_links','internal links resolve',brokenLinks.length===0,false,brokenLinks.slice(0,12).join(', '));
  const target=String(spec.target?.id||'web-node');
  if(target==='web-pwa')addCheck('pwa_surface','PWA manifest/service worker',names.includes('public/manifest.webmanifest')&&names.includes('public/sw.js'),false);
  if(spec?.experience?.threeD)addCheck('3d_fallback','3D has fallback',hasAny(source,['webgl','canvas','fallback','no 3d']),true);
  const required=contract.requiredFeatures;
  if(required.includes('search and filtering'))addCheck('feature_search','search and filtering',hasAny(source,['search','filter']));
  if(required.includes('provider-neutral checkout boundary'))addCheck('feature_checkout','checkout',hasAny(source,['checkout','payment']));
  if(required.includes('provider-neutral local authentication boundary'))addCheck('feature_auth','local authentication',hasAny(source,['login','sign in','session','auth']));
  if(required.includes('booking/availability states'))addCheck('feature_booking','booking',hasAny(source,['booking','appointment','calendar','availability']));
  const passed=checks.filter(x=>x.passed).length;
  const score=Math.round((passed/Math.max(1,checks.length))*100);
  const blockingFindings=checks.filter(x=>x.blocking).map(x=>({id:x.id,label:x.label,detail:x.detail,message:\`\${x.label} is missing or unsafe.\`}));
  const warnings=checks.filter(x=>!x.passed&&!x.blocking).map(x=>({id:x.id,label:x.label,detail:x.detail,message:\`\${x.label} needs improvement.\`}));
  const providerIndependent=blockingFindings.every(x=>x.id!=='local_runtime');
  return {
    version:'product-quality.v2',
    score,
    minimumScore:contract.minimumScore,
    passed,
    total:checks.length,
    checks,
    missing:checks.filter(x=>!x.passed).map(x=>x.label),
    blockingFindings,
    warnings,
    releaseReady:blockingFindings.length===0&&score>=contract.minimumScore,
    portable:true,
    providerIndependent,
    qualityContract:contract,
    internalLinkIssues:brokenLinks,
  };
}
