import crypto from 'node:crypto';

export const WORKSPACE_ROLES=['owner','admin','editor','reviewer','viewer'];
const ROLE_ORDER={owner:4,admin:3,editor:2,reviewer:2,viewer:1};

export function canRole(role,minimum='viewer'){
  return (ROLE_ORDER[String(role||'viewer')]||0)>=(ROLE_ORDER[minimum]||1);
}

export function authorizeProjectRole(store,projectId,userId,minimum='viewer'){
  const project=store?.getProject(projectId,userId);
  if(!project)throw Object.assign(new Error('project_not_found'),{status:404});
  const role=project.user_id===userId?'owner':(store.getWorkspace(project.workspace_id,userId)?.role||'viewer');
  if(!canRole(role,minimum))throw Object.assign(new Error('project_role_required'),{status:403,role,requiredRole:minimum});
  return {project,role};
}

export function projectCapabilityMatrix({role='viewer',plan='free',verified=false,providers=[],cloudConfigured=false}={}){
  const deployProviders=new Set(Array.isArray(providers)?providers:[]);
  return {
    role,
    plan,
    verified,
    canView:canRole(role,'viewer'),
    canEdit:canRole(role,'editor'),
    canReview:canRole(role,'reviewer'),
    canAdmin:canRole(role,'admin'),
    canDesign:canRole(role,'editor'),
    canContent:canRole(role,'editor'),
    canAssets:canRole(role,'editor'),
    canDeploy:canRole(role,'editor')&&verified,
    canManageDomains:canRole(role,'admin'),
    canManageCloud:canRole(role,'admin'),
    canInvite:canRole(role,'admin'),
    canApprove:canRole(role,'reviewer'),
    connectedDeployProviders:[...deployProviders],
    cloudConfigured:Boolean(cloudConfigured),
  };
}

export function defaultDesignSystem(request=''){
  const text=String(request||'').toLowerCase();
  const dark=/(dark|black|neon|cyber|futuristic|immersive)/.test(text);
  const luxury=/(luxury|premium|elegant|fashion|jewelry)/.test(text);
  const playful=/(playful|kids|education|creator|fun)/.test(text);
  return {
    version:1,
    mode:dark?'dark':'auto',
    colors: luxury
      ? {primary:'#111827',accent:'#c9a227',background:'#faf7f0',surface:'#ffffff',text:'#171717',muted:'#6b7280',border:'#e7dfcf'}
      : playful
        ? {primary:'#5b4bff',accent:'#22d3ee',background:'#f8fafc',surface:'#ffffff',text:'#172033',muted:'#667085',border:'#dce3ef'}
        : {primary:'#6c63ff',accent:'#4fd1c5',background:'#07101c',surface:'#0d1726',text:'#f4f7fb',muted:'#8b99b5',border:'#24324b'},
    typography:{
      heading:luxury?'Inter':'Inter',
      body:'Inter',
      mono:'ui-monospace',
      scale:'fluid',
      weightHeading:700,
      weightBody:400,
      lineHeight:1.5
    },
    spacing:{unit:4,xs:4,sm:8,md:12,lg:20,xl:32,xxl:48},
    radius:{sm:8,md:12,lg:18,pill:999},
    shadows:{sm:'0 2px 10px rgba(15,23,42,.08)',md:'0 12px 30px rgba(15,23,42,.12)',lg:'0 30px 80px rgba(15,23,42,.18)'},
    layout:{maxWidth:1280,gutter:24,gridColumns:12,breakpoints:{sm:640,md:768,lg:1024,xl:1280}},
    motion:{preset:dark?'cinematic':'smooth',durationMs:220,easing:'cubic-bezier(.2,.7,.2,1)',reducedMotion:true},
    effects:{glass:dark,gradient:true,parallax:/parallax|scroll/.test(text),threeD:/3d|three\.js|webgl|immersive/.test(text)},
    accessibility:{contrast:'AA',focusVisible:true,reducedMotion:true,keyboard:true,semanticHtml:true},
    componentLibrary:['button','input','card','dialog','table','tabs','toast','nav','footer']
  };
}

export function normalizeDesignSystem(input,request=''){
  const base=defaultDesignSystem(request),x=input&&typeof input==='object'?input:{};
  const merge=(a,b)=>{const out={...a};for(const [k,v] of Object.entries(b||{})){if(v&&typeof v==='object'&&!Array.isArray(v)&&a[k]&&typeof a[k]==='object'&&!Array.isArray(a[k]))out[k]=merge(a[k],v);else out[k]=v;}return out;};
  const out=merge(base,x);
  out.version=Number.isFinite(Number(out.version))?Number(out.version):1;
  out.layout.maxWidth=Math.min(1920,Math.max(720,Number(out.layout.maxWidth)||1280));
  out.spacing.unit=Math.min(16,Math.max(2,Number(out.spacing.unit)||4));
  out.motion.durationMs=Math.min(1200,Math.max(80,Number(out.motion.durationMs)||220));
  out.accessibility.reducedMotion=true;
  return out;
}

export function designModeContract(system){
  const s=normalizeDesignSystem(system);
  return {
    tokens:s,
    cssVariables:{
      '--cv-color-primary':s.colors.primary,
      '--cv-color-accent':s.colors.accent,
      '--cv-color-background':s.colors.background,
      '--cv-color-surface':s.colors.surface,
      '--cv-color-text':s.colors.text,
      '--cv-color-muted':s.colors.muted,
      '--cv-color-border':s.colors.border,
      '--cv-radius-md':String(s.radius.md)+'px',
      '--cv-space-unit':String(s.spacing.unit)+'px'
    },
    constraints:['Use semantic HTML','Keep keyboard focus visible','Honor prefers-reduced-motion','Do not use color alone to convey state','Keep layout within configured content width']
  };
}

function normalizeResearchResult(x){
  const title=String(x?.title||x?.name||'').slice(0,300),url=String(x?.url||x?.link||'').slice(0,1000),text=String(x?.text||x?.content||x?.snippet||'').slice(0,5000);
  return title||url||text?{title,url,text,publishedAt:x?.publishedDate||x?.published_at||null,source:x?.author||x?.domain||null}:null;
}

export async function researchWeb(query,{limit=8,signal,apiUrl=process.env.CODINGVIBES_RESEARCH_API_URL,apiKey=process.env.CODINGVIBES_RESEARCH_API_KEY}={}){
  const q=String(query||'').trim().slice(0,2000);if(!q)return{configured:false,provider:'none',results:[]};
  if(!apiUrl){
    return{configured:false,provider:'none',results:[],message:'Set CODINGVIBES_RESEARCH_API_URL and CODINGVIBES_RESEARCH_API_KEY to enable live agent web research.'};
  }
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),Number(process.env.CODINGVIBES_RESEARCH_TIMEOUT_MS||15000));
  const body={query:q,limit:Math.min(12,Math.max(1,Number(limit)||8))};
  const externalSignal=signal&&typeof signal.addEventListener==='function'?signal:null;
  const abortFromExternal=()=>controller.abort();
  if(externalSignal)externalSignal.addEventListener('abort',abortFromExternal,{once:true});
  try{
    const response=await fetch(apiUrl,{method:'POST',headers:{'content-type':'application/json',accept:'application/json',...(apiKey?{authorization:'Bearer '+apiKey,'x-api-key':apiKey}:{})},body:JSON.stringify(body),signal:controller.signal});
    const contentLength=Number(response.headers.get('content-length')||0);if(contentLength>2*1024*1024)throw new Error('research_response_too_large');
    const raw=await response.text();if(raw.length>2*1024*1024)throw new Error('research_response_too_large');
    if(!response.ok)throw new Error('research_http_'+response.status);
    let json={};try{json=JSON.parse(raw)}catch{json={}};
    const rows=Array.isArray(json.results)?json.results:Array.isArray(json.data)?json.data:Array.isArray(json.items)?json.items:[];
    return{configured:true,provider:String(json.provider||process.env.CODINGVIBES_RESEARCH_PROVIDER||'http-search'),results:rows.map(normalizeResearchResult).filter(Boolean).slice(0,12)};
  }catch(error){
    if(error?.name==='AbortError')return{configured:true,provider:'http-search',results:[],status:'timeout',message:'Research request timed out.'};
    return{configured:true,provider:'http-search',results:[],status:'failed',message:String(error.message||error).slice(0,240)};
  }finally{
    clearTimeout(timeout);
    if(externalSignal)externalSignal.removeEventListener('abort',abortFromExternal);
  }
}

export function parallelAgentPlan(request,spec){
  return {
    mode:'parallel',
    agents:[
      {id:'research',role:'researcher',goal:'Find current external requirements, product patterns and integration constraints.',dependsOn:[]},
      {id:'design',role:'design-architect',goal:'Define tokens, responsive behavior, accessibility and interaction language.',dependsOn:[]},
      {id:'architecture',role:'solution-architect',goal:'Reconcile product requirements with target/toolchain constraints.',dependsOn:['research','design']},
      {id:'qa',role:'qa-reviewer',goal:'Predict acceptance risks and define self-test/reflection checks.',dependsOn:['architecture']}
    ],
    request:String(request||'').slice(0,2000),
    target:spec?.target?.id||'web-node'
  };
}

export async function runParallelAgentAnalysis({request,spec,store,runId,onEvent=()=>{},signal}={}){
  const researchQuery=String(request||'').slice(0,1800);
  const started=Date.now();
  const [research,design]=await Promise.all([
    researchWeb(researchQuery,{signal}),
    Promise.resolve({configured:true,provider:'deterministic-design',results:[{title:'Generated design contract',url:'',text:JSON.stringify(designModeContract(defaultDesignSystem(request)))}]})
  ]);
  const plan=parallelAgentPlan(request,spec);
  const qa={checks:[
    'acceptance criteria mapped to generated surfaces',
    'responsive metadata and overflow checks',
    'accessibility and reduced-motion checks',
    'secret and dependency boundary checks',
    'target artifact/toolchain verification'
  ],confidence:research.configured||research.results.length?0.88:0.74};
  const result={mode:'parallel',durationMs:Date.now()-started,plan,research,design,qa};
  if(store&&runId){
    store.addEvidence(runId,'parallel_agents',result);
    onEvent({type:'parallel_agents_completed',runId,...result});
  }
  return result;
}

export function reflectBuild({spec,verification,review,inspect}={}){
  const checks=[];
  checks.push({id:'contract',ok:Boolean(spec),message:spec?'Application contract exists.':'Application contract missing.'});
  checks.push({id:'verification',ok:Boolean(verification?.passed),message:verification?.passed?'Verification passed.':'Verification did not pass.'});
  checks.push({id:'review',ok:Boolean(review?.passed),message:review?.passed?'Review passed.':'Review requires attention.'});
  if(inspect)checks.push({id:'git-clean',ok:!String(inspect.status?.stdout||'').trim(),message:'Workspace diff is '+(String(inspect.status?.stdout||'').trim()?'present':'clean')+'.'});
  const passed=checks.filter(x=>x.ok).length,total=checks.length;
  return{status:passed===total?'ready':passed>=Math.ceil(total*.75)?'review':'blocked',score:Math.round(passed/total*100),checks,recommendations:checks.filter(x=>!x.ok).map(x=>x.message)};
}

export const CLOUD_SERVICE_CATALOG=[
  {id:'database',label:'Managed Database',description:'Postgres/SQL data service boundary for production projects.'},
  {id:'auth',label:'Authentication',description:'Owner/admin roles, session auth, OAuth-ready identity boundary.'},
  {id:'storage',label:'Object Storage',description:'Persistent media/assets storage abstraction.'},
  {id:'email',label:'Transactional Email',description:'Email delivery service abstraction.'},
  {id:'payments',label:'Payments',description:'Stripe-compatible payment service boundary.'},
  {id:'queue',label:'Background Jobs',description:'Durable job queue abstraction for async work.'},
  {id:'search',label:'Search',description:'Application search/index service abstraction.'},
  {id:'analytics',label:'Product Analytics',description:'Usage and product event telemetry abstraction.'}
];

export async function provisionCloudService({store,userId,projectId,type,config={}}={}){
  const known=CLOUD_SERVICE_CATALOG.some(x=>x.id===type);if(!known)throw new Error('unknown_cloud_service');
  const project=store.getProject(projectId,userId);if(!project)throw new Error('project_not_found');
  const external=process.env.CODINGVIBES_CLOUD_API_URL;
  if(!external){
    const status=['database','auth','payments'].includes(type)?'ready_local':'planned';
    return store.upsertCloudService(projectId,userId,type,{provider:'build-vibe-local',status,config});
  }
  const payload={projectId,type,config};
  try{
    const r=await fetch(external.replace(/\/$/,'')+'/services',{method:'POST',headers:{'content-type':'application/json',...(process.env.CODINGVIBES_CLOUD_API_KEY?{authorization:'Bearer '+process.env.CODINGVIBES_CLOUD_API_KEY}:{})},body:JSON.stringify(payload)});
    const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data?.error||'cloud_service_provision_failed');
    return store.upsertCloudService(projectId,userId,type,{provider:data.provider||'coding-vibes-cloud',status:data.status||'ready',config:{...config,...(data.config||{}),externalId:data.id||null}});
  }catch(error){
    return store.upsertCloudService(projectId,userId,type,{provider:'coding-vibes-cloud',status:'failed',config,error:String(error.message||error).slice(0,500),error:String(error.message||error).slice(0,500)});
  }
}

export function domainVerificationInstructions(domain,provider='vercel'){
  const host=String(domain).trim().toLowerCase();
  return provider==='vercel'
    ? {provider,domain:host,records:[],note:'Open the connected Vercel project and copy the current domain verification/DNS records shown there before changing production DNS.'}
    : {provider,domain:host,records:[],note:'Connect the domain through the selected hosting provider and verify ownership there.'};
}

export function hashInviteToken(token){return crypto.createHash('sha256').update(String(token||'')).digest('hex');}
export function makeInviteToken(){return crypto.randomBytes(24).toString('base64url');}
