import {resolveAny} from 'node:dns/promises';
import http from 'node:http';
import fs from 'node:fs';
import {createHash,randomUUID,randomBytes} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Store} from './db/store.js';
import {ModelRouter} from './ai/router.js';
import {buildUserRouterForUser,providerConnectionInput,normalizeAiSettings,canonicalProvider} from './ai/user-router.js';
import {encryptSecret,decryptSecret} from './security/vault.js';
import {createApiToken,hashApiToken,verifyApiToken,isApiToken} from './security/api-tokens.js';
import {executeBuild,verifyExistingRun} from './agent/orchestrator.js';
import {hashPassword,verifyPassword,signSession,verifySessionToken,setSessionCookie,sessionCookieHeader,clearSessionCookie,readSessionCookie} from './security/auth.js';
import {sendJson,sendText,readJson,streamSse} from './http/json.js';
import {resolveInside} from './core/safe-path.js';
import {inspectWorkspace,commitWorkspace,revertWorkspace} from './git/workspace.js';
import {ensureProjectRepository} from './projects-workspace.js';
import {listTargets,getTarget} from './targets/registry.js';
import {targetExecutionAvailability} from './targets/verify.js';
import {normalizeTargetId} from './targets/detect.js';
import {CODINGVIBES_VERSION} from './version.js';
import {fleetStatus} from './runners/status.js';
import {createCheckpoint,restoreCheckpoint} from './git/checkpoints.js';
import {requireRunnerToken,normalizeRunner} from './runners/registry.js';
import {listIntegrationDefinitions,testIntegration} from './integrations/connectors.js';
import {importGitHubRepository} from './integrations/github.js';
import {buildDiagnostics} from './agent/diagnostics.js';
import {planCatalog,currentPeriodKey,canStartRun,getPlan} from './billing/plans.js';
import {createCheckoutSession,createCustomerPortalSession,verifyStripeSignature,planFromStripePrice,subscriptionPlanFromEvent} from './billing/stripe.js';
import {getPaddleStatus,createPaddleCustomer,createPaddleCheckoutTransaction,createPaddlePortalSession,verifyPaddleSignature,paddlePlanFromPrice,paddlePlanFromSubscription} from './billing/paddle.js';
import {readiness} from './ops/readiness.js';
import {requireSuperAdmin,opsOverview} from './ops/admin.js';
import {backupStore} from './ops/backup.js';
import {featureGate,hasFeature} from './billing/features.js';
import {normalizeVideoRequest,createVideoTask,getVideoTask,downloadVideo} from './media/runway.js';
import {getTemplate,searchTemplates} from './templates/catalog.js';
import {listCapabilities} from './platform/capabilities.js';
import {buildBlueprint} from './platform/blueprint.js';
import {builderResearch} from './platform/research.js';
import {createDefaultSiteContent,normalizeSiteContent,applyContentOperation,contentSchema,contentSummary} from './site/content.js';
import {kitForKind,SITE_KITS} from './site/kits.js';
import {deploymentCatalog,connectProvider,disconnectProvider,deployProject,prepareDeploymentArtifact,getDeploymentStatus,cancelDeployment,authenticateProvider} from './deployment/index.js';
import {beginOAuth,completeOAuth,oauthConfigured} from './deployment/oauth.js';
import {beginGoogleOAuth,completeGoogleOAuth,googleOAuthConfigured,readGoogleOAuthStateCookie,setGoogleOAuthStateCookie,clearGoogleOAuthStateCookieHeader} from './security/google-auth.js';
import {assetType,safeAssetName,hashBuffer,makeAssetRecord,validateAssetUpload,MAX_ASSET_BYTES} from './assets/library.js';
import {baselinePath} from './verification/visual.js';
import {WORKSPACE_ROLES,canRole,authorizeProjectRole,projectCapabilityMatrix,normalizeDesignSystem,designModeContract,researchWeb,provisionCloudService,CLOUD_SERVICE_CATALOG,domainVerificationInstructions,hashInviteToken,makeInviteToken} from './platform/feature-suite.js';
import {auditDiscoverability,aeoSummary} from './verification/discoverability.js';
import {runTool as runFabricTool,runToolPipeline as runFabricPipeline,listToolContracts,getToolContract} from './tool-fabric/index.js';
import {submitIndexNow} from './seo/indexnow.js';
import {listPublicSeoPages,renderPublicSeoPage} from './seo/public-pages.js';
import {telemetry,requestLogEvent} from './ops/telemetry.js';
import {sanitizeProductEvent,recordProductEvent} from './ops/product-analytics.js';
import {normalizeFeatureFlag,evaluateFeatureFlag} from './ops/feature-flags.js';
import {scaleOutConfig as scaleOutConfigSnapshot} from './platform/scaleout.js';

const root=path.dirname(fileURLToPath(import.meta.url));const publicDir=path.join(root,'..','public');const PUBLIC_SEO_ROUTES=listPublicSeoPages().map(x=>x.path);
export const store=new Store();export const router=new ModelRouter();
const HOST=process.env.HOST||'127.0.0.1';const PORT=Number(process.env.PORT||4400);const MAX_BODY=Number(process.env.CODINGVIBES_MAX_BODY_BYTES||2*1024*1024);const MAX_ASSET_UPLOAD_BYTES=3*1024*1024;const MAX_ASSET_UPLOAD_BODY=Math.ceil(MAX_ASSET_UPLOAD_BYTES*4/3)+64*1024;const activeBuilds=new Map();const buckets=new Map();const authBuckets=new Map();
function clientAddress(req){if(process.env.CODINGVIBES_TRUST_PROXY==='true'){const forwarded=String(req.headers['x-forwarded-for']||'').split(',')[0].trim();if(forwarded)return forwarded;}return req.socket.remoteAddress||'unknown';}
function consumeRateLimit(bucketMap,key,limit,windowMs){const now=Date.now();if(bucketMap.size>10000){for(const [k,v] of bucketMap){if(now-v.start>windowMs)bucketMap.delete(k);}}const b=bucketMap.get(key)||{start:now,count:0};if(now-b.start>windowMs){b.start=now;b.count=0}b.count++;bucketMap.set(key,b);return b.count<=limit;}
function rateLimit(req){return consumeRateLimit(buckets,clientAddress(req),180,60000);}
function authRateLimit(req,scope){return consumeRateLimit(authBuckets,`${clientAddress(req)}:${scope}`,12,60000);}
function auth(req){const token=readSessionCookie(req);if(!token)return null;const id=verifySessionToken(token);return id?store.getAuthSession(id):null;}
function requireAuth(req,res){const a=auth(req);if(!a){sendJson(res,401,{ok:false,error:'authentication_required'});return null}return a;}
function requireProjectRole(projectId,userId,minimum='viewer'){return authorizeProjectRole(store,projectId,userId,minimum);}
function userRouter(userId){return buildUserRouterForUser({store,userId,env:process.env});}
function apiTokenAuth(req){
  const header=String(req.headers.authorization||'');
  const token=header.replace(/^Bearer\s+/i,'').trim();
  if(!isApiToken(token))return null;
  const row=store.findActiveApiTokenByHash(hashApiToken(token));
  if(!row)return null;
  store.touchApiToken(row.id);
  return row;
}
function normalizeGatewayMessages(messages){
  if(!Array.isArray(messages)||messages.length<1||messages.length>40)throw Object.assign(new Error('messages_required'),{status:400});
  return messages.map(m=>{
    const role=String(m?.role||'');
    if(!['system','user','assistant','tool'].includes(role))throw Object.assign(new Error('unsupported_message_role'),{status:400});
    const content=typeof m?.content==='string'?m.content:String(m?.content?.[0]?.text||'');
    if(!content||content.length>100000)throw Object.assign(new Error('invalid_message_content'),{status:400});
    return {role,content};
  });
}
function pathParam(pathname,prefix){return decodeURIComponent(pathname.slice(prefix.length));}
function normalizeOrigin(value){try{const u=new URL(String(value));return `${u.protocol}//${u.host}`.toLowerCase().replace(/\/$/,'');}catch{return null}}
function sameOrigin(req){const fetchSite=String(req.headers['sec-fetch-site']||'').trim().toLowerCase();if(fetchSite==='cross-site')return false;const origin=req.headers.origin;if(!origin)return true;const actual=normalizeOrigin(origin);if(!actual)return false;const configured=[process.env.CODINGVIBES_PUBLIC_URL,...String(process.env.CODINGVIBES_ALLOWED_ORIGINS||'').split(',')].map(normalizeOrigin).filter(Boolean);if(configured.length)return configured.includes(actual);return actual===normalizeOrigin(publicOrigin(req));}
async function notifyIndexNow(deployedUrl,workspace){const key=String(process.env.CODINGVIBES_INDEXNOW_KEY||'').trim();if(!key||!deployedUrl)return {ok:false,skipped:true,reason:key?'deployment_url_missing':'indexnow_key_not_configured'};let pages=['/'];try{const specFile=path.join(workspace,'codingvibes.app.json');const spec=JSON.parse(fs.readFileSync(specFile,'utf8'));pages=Array.isArray(spec.pages)?spec.pages.filter(p=>!['/admin','/login'].includes(p)):pages}catch{}const base=String(deployedUrl).replace(/\/$/,'');const urls=[...new Set(pages.map(p=>base+(p||'/')))];try{return await submitIndexNow({urls,key,keyLocation:process.env.CODINGVIBES_INDEXNOW_KEY_LOCATION})}catch(e){return {ok:false,skipped:false,error:e.message}}}
export function publicOrigin(req){const configured=String(process.env.CODINGVIBES_PUBLIC_URL||'').trim();if(configured)return configured.replace(/\/$/,'');const trustProxy=process.env.CODINGVIBES_TRUST_PROXY==='true';const proto=(trustProxy?String(req.headers['x-forwarded-proto']||''):((req.socket&&req.socket.encrypted)?'https':'http')).split(',')[0].trim()||'http';const host=(trustProxy?String(req.headers['x-forwarded-host']||''):String(req.headers.host||HOST)).split(',')[0].trim()||HOST;return `${proto}://${host}`.replace(/\/$/,'');}
function normalizeReturnUrl(value,base){const raw=String(value||'').trim();if(!raw)return base;try{const parsed=new URL(raw,base),trusted=new URL(base);if(parsed.origin!==trusted.origin)throw Object.assign(new Error('cross_origin_redirect_url'),{status:400});return parsed.href;}catch(e){if(e?.status===400)throw e;throw Object.assign(new Error('invalid_redirect_url'),{status:400});}}
async function serveStatic(req,res){let pathname=new URL(req.url,'http://localhost').pathname;if(pathname==='/')pathname='/landing.html';if(pathname==='/app')pathname='/index.html';if(pathname==='/terms')pathname='/terms.html';if(pathname==='/privacy')pathname='/privacy.html';let target;try{target=resolveInside(publicDir,pathname.slice(1));}catch{return false}if(!fs.existsSync(target)||!fs.statSync(target).isFile())return false;const type={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.webmanifest':'application/manifest+json','.txt':'text/plain; charset=utf-8'}[path.extname(target)]||'application/octet-stream';let body=fs.readFileSync(target);if(path.extname(target)==='.html'){body=body.toString('utf8').replaceAll('__SITE_URL__',publicOrigin(req));if(path.basename(target)==='pay.html'){body=body.replaceAll('__PADDLE_CLIENT_TOKEN__',String(process.env.PADDLE_CLIENT_TOKEN||''));}if(path.basename(target)==='landing.html'){const verification=[];if(process.env.CODINGVIBES_GOOGLE_SITE_VERIFICATION)verification.push('<meta name="google-site-verification" content="'+String(process.env.CODINGVIBES_GOOGLE_SITE_VERIFICATION).replace(/[^A-Za-z0-9_-]/g,'')+'">');if(process.env.CODINGVIBES_BING_SITE_VERIFICATION)verification.push('<meta name="msvalidate.01" content="'+String(process.env.CODINGVIBES_BING_SITE_VERIFICATION).replace(/[^A-Za-z0-9_-]/g,'')+'">');body=body.replace('<!--__SITE_VERIFICATION__-->',verification.join(''));}}sendText(res,200,body,type);return true;}
async function readRawBuffer(req,max=MAX_BODY){return await new Promise((resolve,reject)=>{let chunks=[],size=0;req.on('data',chunk=>{size+=chunk.length;if(size>max){reject(Object.assign(new Error('body_too_large'),{status:413}));req.destroy();return;}chunks.push(Buffer.from(chunk))});req.on('end',()=>resolve(Buffer.concat(chunks)));req.on('error',reject)});}
async function readRawBody(req,max=MAX_BODY){return await new Promise((resolve,reject)=>{let data='';let size=0;req.setEncoding('utf8');req.on('data',chunk=>{size+=Buffer.byteLength(chunk);if(size>max){reject(Object.assign(new Error('body_too_large'),{status:413}));req.destroy();return;}data+=chunk});req.on('end',()=>resolve(data));req.on('error',reject)});}
function listFiles(dir){const out=[];const walk=(current,rel='')=>{for(const name of fs.readdirSync(current)){if(name==='.git'||name==='node_modules'||name==='.codingvibes')continue;const full=path.join(current,name),next=path.join(rel,name),st=fs.lstatSync(full);if(st.isSymbolicLink())continue;if(st.isDirectory())walk(full,next);else out.push(next.replaceAll('\\','/'));if(out.length>=1000)return;}};walk(dir);return out;}
function writeProjectContentFile(project,content){
 if(!project?.repo_path)return;
 const file=path.join(project.repo_path,'public','content','site.json');
 fs.mkdirSync(path.dirname(file),{recursive:true});
 fs.writeFileSync(file,JSON.stringify(content,null,2)+'\n','utf8');
}
function syncProjectContent(projectId,userId,content){
 const project=store.getProject(projectId,userId);if(!project)return;
 writeProjectContentFile(project,content);
 for(const session of store.listSessions(projectId,userId)){for(const run of store.listRuns(session.id,userId)){if(!run.workspace)continue;try{writeProjectContentFile({...project,repo_path:run.workspace},content)}catch{}break;}}
}

export function createAppServer(){return http.createServer(async(req,res)=>{
 try{
  const requestId=randomUUID();const startedAt=Date.now();res.setHeader('x-request-id',requestId);res.once('finish',()=>{
    const event={requestId,method:req.method||'GET',path:req.url||'/',status:res.statusCode,durationMs:Date.now()-startedAt};
    telemetry.record(event);
    if(process.env.NODE_ENV==='production'&&process.env.CODINGVIBES_STRUCTURED_ACCESS_LOGS==='false')return;
    if(process.env.NODE_ENV==='production'||process.env.CODINGVIBES_STRUCTURED_ACCESS_LOGS==='true')console.log(JSON.stringify(requestLogEvent(event)));
  });
  res.setHeader('x-content-type-options','nosniff');res.setHeader('x-frame-options','SAMEORIGIN');res.setHeader('referrer-policy','same-origin');res.setHeader('cross-origin-resource-policy','same-origin');res.setHeader('cross-origin-opener-policy','same-origin');res.setHeader('permissions-policy','camera=(),microphone=(),geolocation=()');res.setHeader('content-security-policy',"default-src 'self'; script-src 'self' https://cdn.jsdelivr.net https://unpkg.com https://esm.sh https://cdn.paddle.com; style-src 'self'; img-src 'self' data: blob:; connect-src 'self' https://api.dev.runwayml.com https://*.paddle.com; frame-src 'self' http: https: https://*.paddle.com; worker-src 'self' blob:; frame-ancestors 'self'; base-uri 'self'; form-action 'self'");if(process.env.NODE_ENV==='production')res.setHeader('strict-transport-security','max-age=15552000; includeSubDomains');
  if(!rateLimit(req))return sendJson(res,429,{ok:false,error:'rate_limit'});
  const u=new URL(req.url||'/',`http://${req.headers.host||HOST}`),method=req.method||'GET';if(u.pathname==='/health'||u.pathname==='/ready'||u.pathname.startsWith('/api/')||u.pathname.startsWith('/v1/'))res.setHeader('cache-control','no-store');
  if(method==='GET'&&u.pathname==='/health')return sendJson(res,200,{ok:true,service:'build-vibe',version:CODINGVIBES_VERSION,time:new Date().toISOString()});
  if(method==='GET'&&u.pathname==='/api/launch/status'){try{const adminId=requireSuperAdmin(req,store);const r=readiness({router,store});const fleet=fleetStatus(store),scaleout=scaleOutConfigSnapshot();store.addAuditLog({actorUserId:adminId,action:'launch.status.viewed',resourceType:'system'});return sendJson(res,200,{ok:true,version:CODINGVIBES_VERSION,readiness:{ready:r.ready,runtime:r.runtime,blockers:r.blockers,warnings:r.warnings},fleet:{ready:fleet.ready,mode:fleet.mode,production:fleet.production,security:fleet.security,macos:fleet.macos},scaleout:{ready:scaleout.ready,database:scaleout.database.backend,objectStorage:scaleout.objectStorage.backend,queue:scaleout.queue.backend,blockers:scaleout.blockers},telemetry:telemetry.snapshot()});}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message})}}
  if(method==='GET'&&u.pathname==='/api/ops/metrics'){try{const adminId=requireSuperAdmin(req,store);store.addAuditLog({actorUserId:adminId,action:'ops.metrics.viewed',resourceType:'system'});return sendJson(res,200,{ok:true,telemetry:telemetry.snapshot()});}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message})}}
  if(method==='GET'&&u.pathname==='/robots.txt')return sendText(res,200,`User-agent: *\\nAllow: /\\nDisallow: /api/\\nDisallow: /app\\nSitemap: ${publicOrigin(req)}/sitemap.xml\\n`,'text/plain; charset=utf-8');
  if(method==='GET'&&u.pathname==='/sitemap.xml'){const base=publicOrigin(req),routes=['/',...PUBLIC_SEO_ROUTES,'/terms','/privacy'],unique=[...new Set(routes)];const xml=unique.map(route=>`<url><loc>${base}${route}</loc></url>`).join('');return sendText(res,200,`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${xml}</urlset>`,'application/xml; charset=utf-8');}
if(method==='GET'&&PUBLIC_SEO_ROUTES.includes(u.pathname)){const html=renderPublicSeoPage(u.pathname,{baseUrl:publicOrigin(req)});if(html)return sendText(res,200,html,'text/html; charset=utf-8');}
  if(method==='GET'&&u.pathname==='/ready'){const r=readiness({router,store});if(process.env.NODE_ENV==='production'&&!r.ready)return sendJson(res,503,{ok:false,ready:false,service:'build-vibe',status:'not_ready'});if(process.env.NODE_ENV==='production')return sendJson(res,200,{ok:true,ready:true,service:'build-vibe',status:'ready'});return sendJson(res,r.ready?200:503,{ok:r.ready,...r});}
  if(['POST','PUT','PATCH','DELETE'].includes(method)&&u.pathname!=='/api/billing/webhook'&&u.pathname!=='/api/billing/paddle/webhook'&&!sameOrigin(req))return sendJson(res,403,{ok:false,error:'cross_origin_request_blocked'});
  if(method==='GET'&&u.pathname==='/api/auth/google/config'){return sendJson(res,200,{ok:true,configured:googleOAuthConfigured()});}
  if(method==='GET'&&u.pathname==='/api/auth/google'){
    if(!googleOAuthConfigured())return sendJson(res,503,{ok:false,error:'google_oauth_not_configured'});
    try{
      const base=publicOrigin(req),redirectAfter=normalizeReturnUrl(u.searchParams.get('redirect'),base+'/app');
      const started=beginGoogleOAuth(store,{redirectAfter});
      setGoogleOAuthStateCookie(res,started.state);
      res.writeHead(302,{'Location':started.url,'Cache-Control':'no-store'});return res.end();
    }catch(e){return sendJson(res,e.status||503,{ok:false,error:e.message});}
  }
  if(method==='GET'&&u.pathname==='/api/auth/google/callback'){
    const state=String(u.searchParams.get('state')||''),cookieState=readGoogleOAuthStateCookie(req),error=String(u.searchParams.get('error')||'');
    const fail=(reason,status=400)=>{res.setHeader('Set-Cookie',clearGoogleOAuthStateCookieHeader());const target=publicOrigin(req)+'/app?auth_error='+encodeURIComponent(reason);res.writeHead(302,{'Location':target,'Cache-Control':'no-store'});return res.end();};
    if(!state||!cookieState||state!==cookieState)return fail('oauth_state_invalid');
    if(error)return fail('google_'+String(error).replace(/[^a-z0-9_]+/gi,'_').slice(0,80),400);
    try{
      const result=await completeGoogleOAuth(store,{code:u.searchParams.get('code'),state});
      const profile=result.profile;
      let identity=store.getAuthIdentity('google',profile.sub),user=identity?store.getUser(identity.user_id):null,created=false;
      if(!user){
        user=store.getUserByEmail(profile.email);
        if(!user){created=true;user=store.createUser(profile.email,await hashPassword(randomBytes(32).toString('base64url')));}
        identity=store.createAuthIdentity(user.id,{provider:'google',subject:profile.sub,email:profile.email,metadata:{name:profile.name,picture:profile.picture}});
        if(!identity)throw Object.assign(new Error('google_identity_persistence_failed'),{status:500});
      }
      const session=store.createAuthSession(user.id);
      store.addAuditLog({actorUserId:user.id,action:created?'auth.google.signup':'auth.google.login',resourceType:'user',resourceId:user.id,metadata:{provider:'google'}});
      const target=normalizeReturnUrl(result.redirectAfter,publicOrigin(req)+'/app');
      res.setHeader('Set-Cookie',[sessionCookieHeader(signSession(session.id)),clearGoogleOAuthStateCookieHeader()]);
      res.writeHead(302,{'Location':target,'Cache-Control':'no-store'});return res.end();
    }catch(e){return fail(e.message==='google_email_not_verified'?'google_email_not_verified':'google_auth_failed',e.status||400);}
  }
  if(method==='POST'&&u.pathname==='/api/auth/signup'){if(!authRateLimit(req,'signup'))return sendJson(res,429,{ok:false,error:'rate_limit',retry_after_seconds:60});const b=await readJson(req,MAX_BODY);const email=String(b.email||'').trim().toLowerCase(),password=String(b.password||'');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<8)return sendJson(res,400,{ok:false,error:'valid email and password (8+ characters) required'});if(store.getUserByEmail(email))return sendJson(res,409,{ok:false,error:'account_exists'});const user=store.createUser(email,await hashPassword(password));store.addAuditLog({actorUserId:user.id,action:'auth.signup',resourceType:'user',resourceId:user.id});const session=store.createAuthSession(user.id);setSessionCookie(res,signSession(session.id));return sendJson(res,201,{ok:true,user});}
  if(method==='POST'&&u.pathname==='/api/auth/login'){if(!authRateLimit(req,'login'))return sendJson(res,429,{ok:false,error:'rate_limit',retry_after_seconds:60});const b=await readJson(req,MAX_BODY),user=store.getUserByEmail(String(b.email||''));if(!user||!(await verifyPassword(String(b.password||''),user.password_hash)))return sendJson(res,401,{ok:false,error:'invalid_credentials'});const session=store.createAuthSession(user.id);store.addAuditLog({actorUserId:user.id,action:'auth.login',resourceType:'user',resourceId:user.id});setSessionCookie(res,signSession(session.id));return sendJson(res,200,{ok:true,user:{id:user.id,email:user.email,created_at:user.created_at}});}
  if(method==='POST'&&u.pathname==='/api/auth/logout'){const token=readSessionCookie(req);const id=token&&verifySessionToken(token);if(id)store.deleteAuthSession(id);clearSessionCookie(res);return sendJson(res,200,{ok:true});}
  if(method==='GET'&&u.pathname==='/api/ops/overview'){try{const adminId=requireSuperAdmin(req,store);store.addAuditLog({actorUserId:adminId,action:'ops.overview.viewed',resourceType:'system'});return sendJson(res,200,{ok:true,version:CODINGVIBES_VERSION,overview:opsOverview(store)});}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message});}}
  if(method==='GET'&&u.pathname==='/api/ops/analytics'){try{const adminId=requireSuperAdmin(req,store);store.addAuditLog({actorUserId:adminId,action:'ops.analytics.viewed',resourceType:'system'});const days=Math.min(Math.max(Number(u.searchParams.get('days')||30),1),90),since=new Date(Date.now()-days*864e5).toISOString();return sendJson(res,200,{ok:true,analytics:store.productAnalyticsSummary({since})});}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message});}}
  if(method==='GET'&&u.pathname==='/api/ops/feature-flags'){try{const adminId=requireSuperAdmin(req,store);store.addAuditLog({actorUserId:adminId,action:'ops.feature_flags.viewed',resourceType:'system'});return sendJson(res,200,{ok:true,featureFlags:store.listFeatureFlags()});}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message});}}
  if(method==='PUT'&&u.pathname==='/api/ops/feature-flags'){try{const adminId=requireSuperAdmin(req,store),b=await readJson(req,MAX_BODY),flag=normalizeFeatureFlag(b),saved=store.upsertFeatureFlag(adminId,flag);store.addAuditLog({actorUserId:adminId,action:'ops.feature_flag.updated',resourceType:'feature_flag',resourceId:flag.key,metadata:{enabled:flag.enabled,rolloutPercentage:flag.rolloutPercentage,killSwitch:flag.killSwitch}});return sendJson(res,200,{ok:true,featureFlag:saved});}catch(e){return sendJson(res,e.status||400,{ok:false,error:e.message});}}
  if(method==='GET'&&u.pathname==='/api/ops/audit'){try{const adminId=requireSuperAdmin(req,store);const limit=Math.min(Math.max(Number(u.searchParams.get('limit')||100),1),500);return sendJson(res,200,{ok:true,audit:store.listAuditLogs({limit})});}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message});}}
  if(method==='POST'&&u.pathname==='/api/ops/backup'){try{const adminId=requireSuperAdmin(req,store);const result=backupStore(store);store.addAuditLog({actorUserId:adminId,action:'ops.backup.created',resourceType:'database',metadata:{size:result.size,sha256:result.sha256}});return sendJson(res,201,{ok:true,backup:{...result,path:undefined}});}catch(e){return sendJson(res,e.status||500,{ok:false,error:e.message});}}
  if(method==='POST'&&u.pathname==='/api/billing/paddle/webhook'){
    const raw=await readRawBody(req,MAX_BODY),signature=String(req.headers['paddle-signature']||'');
    if(!verifyPaddleSignature(raw,signature,process.env.PADDLE_WEBHOOK_SECRET))return sendJson(res,400,{ok:false,error:'invalid_paddle_signature'});
    let event;try{event=JSON.parse(raw)}catch{return sendJson(res,400,{ok:false,error:'invalid_paddle_event'})}
    const eventId=String(event?.event_id||event?.id||''),eventType=String(event?.event_type||event?.type||'');if(!eventId||!eventType)return sendJson(res,400,{ok:false,error:'invalid_paddle_event'});
    if(store.hasBillingEvent('paddle:'+eventId))return sendJson(res,200,{ok:true,duplicate:true,eventId});
    const obj=event.data||{},custom=obj.custom_data||{},userId=String(custom.build_vibe_user_id||custom.user_id||'');
    let account=userId?store.getBilling(userId):null;
    if(!account&&obj.subscription_id)account=store.getBillingByProviderSubscription('paddle',obj.subscription_id);
    if(!account&&obj.id&&eventType.startsWith('subscription.'))account=store.getBillingByProviderSubscription('paddle',obj.id);
    if(!account&&obj.customer_id)account=store.getBillingByProviderCustomer('paddle',obj.customer_id);
    const prices=Array.isArray(obj.items)?obj.items:[],pricePlan=prices.reduce((found,item)=>found||paddlePlanFromPrice(item?.price?.id||item?.price_id),null);
    if(eventType==='transaction.completed' || eventType==='subscription.created' || eventType==='subscription.updated' || eventType==='subscription.resumed'){
      const plan=pricePlan||paddlePlanFromSubscription(obj),statusRaw=eventType==='transaction.completed'?'active':String(obj.status||'active'),status=['active','trialing'].includes(statusRaw)?'active':statusRaw||'past_due',providerSubscriptionId=eventType.startsWith('subscription.')?String(obj.id||''):String(obj.subscription_id||account?.provider_subscription_id||'');
      if(account)store.updateBilling(account.user_id,{billing_provider:'paddle',plan:plan||account.plan,status,provider_customer_id:String(obj.customer_id||account.provider_customer_id||''),provider_subscription_id:providerSubscriptionId,provider_transaction_id:eventType==='transaction.completed'?String(obj.id||''):account.provider_transaction_id||''});
    }else if(eventType==='subscription.canceled' || eventType==='subscription.paused'){
      if(account)store.updateBilling(account.user_id,{billing_provider:'paddle',plan:eventType==='subscription.canceled'?'free':account.plan,status:eventType==='subscription.canceled'?'canceled':'paused',provider_customer_id:String(obj.customer_id||account.provider_customer_id||''),provider_subscription_id:String(obj.id||account.provider_subscription_id||''),current_period_end:obj.scheduled_change?.effective_at||obj.canceled_at||account.current_period_end});
    }
    store.recordBillingEvent('paddle:'+eventId,eventType,createHash('sha256').update(raw).digest('hex'));
    return sendJson(res,200,{ok:true,eventId,type:eventType,handled:Boolean(account)});
  }
  if(method==='POST'&&u.pathname==='/api/billing/webhook'){
    const raw=await readRawBody(req,MAX_BODY),signature=String(req.headers['stripe-signature']||'');
    if(!verifyStripeSignature(raw,signature,process.env.STRIPE_WEBHOOK_SECRET))return sendJson(res,400,{ok:false,error:'invalid_stripe_signature'});
    let event;try{event=JSON.parse(raw)}catch{return sendJson(res,400,{ok:false,error:'invalid_stripe_event'})}
    if(!event?.id||!event?.type)return sendJson(res,400,{ok:false,error:'invalid_stripe_event'});
    const digest=createHash('sha256').update(raw).digest('hex');
    if(store.hasBillingEvent(event.id))return sendJson(res,200,{ok:true,duplicate:true,eventId:event.id});
    const obj=event.data?.object||{};let account=null;
    if(event.type==='checkout.session.completed'&&obj.client_reference_id)account=store.getBilling(String(obj.client_reference_id));
    if(!account&&obj.subscription)account=store.getBillingBySubscription(String(obj.subscription));
    if(!account&&obj.customer)account=store.getBillingByCustomer(String(obj.customer));
    if(event.type==='checkout.session.completed'){
      const metadataPlan=['pro','team'].includes(String(obj.metadata?.plan||''))?String(obj.metadata.plan):null,pricePlan=planFromStripePrice(obj.metadata?.price_id);
      const patch={status:'active',billing_provider:'stripe'};if(obj.customer){patch.stripe_customer_id=String(obj.customer);patch.provider_customer_id=String(obj.customer);}if(obj.subscription){patch.stripe_subscription_id=String(obj.subscription);patch.provider_subscription_id=String(obj.subscription);}patch.provider_transaction_id=String(obj.id||'');
      if(pricePlan)patch.plan=pricePlan;else if(metadataPlan)patch.plan=metadataPlan;if(account)store.updateBilling(account.user_id,patch);
    }else if(event.type==='customer.subscription.created'||event.type==='customer.subscription.updated'){
      const plan=subscriptionPlanFromEvent(obj),rawStatus=String(obj.status||''),status=['active','trialing'].includes(rawStatus)?'active':rawStatus||'past_due';
      if(account)store.updateBilling(account.user_id,{plan:plan||account.plan,status,billing_provider:'stripe',stripe_customer_id:String(obj.customer||account.stripe_customer_id||''),stripe_subscription_id:String(obj.id||account.stripe_subscription_id||''),provider_customer_id:String(obj.customer||account.provider_customer_id||''),provider_subscription_id:String(obj.id||account.provider_subscription_id||''),current_period_end:obj.current_period_end?new Date(Number(obj.current_period_end)*1000).toISOString():account.current_period_end,cancel_at_period_end:Boolean(obj.cancel_at_period_end)});
    }else if(event.type==='customer.subscription.deleted'){if(account)store.updateBilling(account.user_id,{plan:'free',status:'canceled',billing_provider:'stripe',cancel_at_period_end:false,current_period_end:obj.ended_at?new Date(Number(obj.ended_at)*1000).toISOString():account.current_period_end});}
    else if(event.type==='invoice.payment_failed'){if(account)store.updateBilling(account.user_id,{status:'past_due'});}
    else if(event.type==='invoice.paid'){if(account)store.updateBilling(account.user_id,{status:'active'});}
    store.recordBillingEvent(event.id,event.type,digest);
    store.addAuditLog({actorUserId:account?.user_id||null,action:'billing.webhook.processed',resourceType:'billing_event',resourceId:event.id,metadata:{type:event.type,matched:Boolean(account)}});
    return sendJson(res,200,{ok:true,processed:true,matched:Boolean(account),eventId:event.id});
  }
  if(method==='GET'&&u.pathname==='/api/auth/me'){const a=auth(req);return sendJson(res,200,{ok:true,user:a?store.getUser(a.user_id):null});}
  if(u.pathname==='/v1/models'&&method==='GET'){
    const tokenUser=apiTokenAuth(req);if(!tokenUser)return sendJson(res,401,{ok:false,error:'invalid_api_token'},{'www-authenticate':'Bearer'});
    const r=userRouter(tokenUser.user_id),seen=new Set(),data=[];
    for(const c of r.listConnectors().filter(x=>x.configured)){
      for(const model of [c.defaultModel,r.resolveModel('standard',c.id),r.resolveModel('premium',c.id),r.resolveModel('cheap',c.id)]){
        if(!model||seen.has(c.id+':'+model))continue;seen.add(c.id+':'+model);data.push({id:model,object:'model',owned_by:'codingvibes/'+c.id});
      }
    }
    return sendJson(res,200,{object:'list',data});
  }
  if(u.pathname==='/v1/chat/completions'&&method==='POST'){
    const tokenUser=apiTokenAuth(req);if(!tokenUser)return sendJson(res,401,{ok:false,error:'invalid_api_token'},{'www-authenticate':'Bearer'});
    try{
      const b=await readJson(req,MAX_BODY),messages=normalizeGatewayMessages(b.messages),system=messages.filter(x=>x.role==='system').map(x=>x.content).join('\n\n'),r=userRouter(tokenUser.user_id);
      if(!r.getStatus().configured)return sendJson(res,503,{ok:false,error:'no_ai_provider_configured'});
      const requestedProvider=String(b.provider||req.headers['x-codingvibes-provider']||'').trim()||undefined;
      const requestedModel=String(b.model||'').trim()||undefined;
      const rawTemperature=Number(b.temperature??0),temperature=Number.isFinite(rawTemperature)?Math.max(0,Math.min(2,rawTemperature)):0;
      const rawMaxTokens=Number(b.max_tokens||8192),maxTokens=Number.isFinite(rawMaxTokens)?Math.min(16384,Math.max(1,rawMaxTokens)):8192;
      const id='chatcmpl-'+randomUUID(),created=Math.floor(Date.now()/1000);
      if(b.stream===true){
        const send=streamSse(res);let usage=null;send({id,object:'chat.completion.chunk',created,model:requestedModel||r.resolveModel('standard',requestedProvider),choices:[{index:0,delta:{role:'assistant'},finish_reason:null}]});
        const out=await r.stream({system,messages,tier:String(b.tier||'standard'),temperature,maxTokens,provider:requestedProvider,model:requestedModel,onToken:token=>send({id,object:'chat.completion.chunk',created,model:requestedModel||'',choices:[{index:0,delta:{content:token},finish_reason:null}]}),onUsage:u=>{usage=u;}});
        send({id,object:'chat.completion.chunk',created,model:out.model,choices:[{index:0,delta:{},finish_reason:'stop'}],usage:usage?{prompt_tokens:usage.inputTokens,completion_tokens:usage.outputTokens,total_tokens:usage.inputTokens+usage.outputTokens}:undefined});
        res.write('data: [DONE]\\n\\n');res.end();return;
      }
      const out=await r.complete({system,messages,tier:String(b.tier||'standard'),temperature,maxTokens,provider:requestedProvider,model:requestedModel});
      return sendJson(res,200,{id,object:'chat.completion',created,model:out.model,choices:[{index:0,message:{role:'assistant',content:out.text||''},finish_reason:'stop'}],usage:{prompt_tokens:out.usage?.inputTokens||0,completion_tokens:out.usage?.outputTokens||0,total_tokens:(out.usage?.inputTokens||0)+(out.usage?.outputTokens||0)},provider:out.provider});
    }catch(e){return sendJson(res,e.status||502,{ok:false,error:e.message});}
  }
  // Runner control-plane endpoints use a dedicated service token, never end-user sessions.
  if(u.pathname==='/api/fleet/runners/register'&&method==='POST'){try{requireRunnerToken(req.headers['x-codingvibes-runner-token']||String(req.headers.authorization||'').replace(/^Bearer\s+/i,''));const b=normalizeRunner(await readJson(req,MAX_BODY));return sendJson(res,200,{ok:true,runner:store.upsertRunner(b)})}catch(e){return sendJson(res,e.status||400,{ok:false,error:e.message})}}
  if(/^\/api\/fleet\/runners\/[^/]+\/heartbeat$/.test(u.pathname)&&method==='POST'){try{requireRunnerToken(req.headers['x-codingvibes-runner-token']||String(req.headers.authorization||'').replace(/^Bearer\s+/i,''));const id=pathParam(u.pathname,'/api/fleet/runners/').replace(/\/heartbeat$/,'');const b=await readJson(req,MAX_BODY);const runner=store.heartbeatRunner(id,{status:b.status,metadata:b.metadata});if(!runner)return sendJson(res,404,{ok:false,error:'runner_not_found'});return sendJson(res,200,{ok:true,runner})}catch(e){return sendJson(res,e.status||400,{ok:false,error:e.message})}}
  if(method==='GET'&&u.pathname==='/api/fleet/runners'){try{requireRunnerToken(req.headers['x-codingvibes-runner-token']||String(req.headers.authorization||'').replace(/^Bearer\s+/i,''));return sendJson(res,200,{ok:true,runners:store.listRunners({staleMs:Number(process.env.CODINGVIBES_RUNNER_STALE_MS||120000)})})}catch(e){return sendJson(res,e.status||401,{ok:false,error:e.message})}}
  if(method==='GET'&&u.pathname==='/.well-known/codingvibes-ai.json')return sendJson(res,200,{name:'Build Vibe AI Gateway',version:CODINGVIBES_VERSION,protocol:'openai-compatible',basePath:'/v1',endpoints:{models:'/v1/models',chatCompletions:'/v1/chat/completions'},authentication:'Authorization: Bearer cv_live_...',providerOverrideHeader:'X-CodingVibes-Provider'});
  if(method==='GET'&&u.pathname==='/api/templates'){const q=u.searchParams.get('q')||'',category=u.searchParams.get('category')||'',kind=u.searchParams.get('kind')||'',experience=u.searchParams.get('experience')||'',tier=u.searchParams.get('tier')||'',featured=u.searchParams.get('featured')==='true';return sendJson(res,200,{ok:true,templates:searchTemplates(q,{category,kind,experience,tier,featured})});}
  if(method==='GET'&&u.pathname==='/api/builder/capabilities')return sendJson(res,200,{ok:true,capabilities:listCapabilities()});
  if(method==='GET'&&!u.pathname.startsWith('/api/')&&await serveStatic(req,res))return;
  if(method==='POST'&&u.pathname==='/api/analytics/events'){try{const b=await readJson(req,MAX_BODY),event=sanitizeProductEvent({userId,projectId:b.projectId||null,sessionId:b.sessionId||null,event:b.event,properties:b.properties});if(event.projectId&&!store.getProject(event.projectId,userId))return sendJson(res,404,{ok:false,error:'project_not_found'});const saved=recordProductEvent(store,event);return sendJson(res,201,{ok:true,event:{id:saved.id,event:saved.event,created_at:saved.created_at}});}catch(e){return sendJson(res,e.status||400,{ok:false,error:e.message});}}
  const a=requireAuth(req,res);if(!a)return;const userId=a.user_id;
  if(method==='GET'&&u.pathname==='/api/tool-fabric/catalog'){
    const contracts=listToolContracts({category:u.searchParams.get('category')||'',query:u.searchParams.get('q')||'',status:u.searchParams.get('status')||''});
    return sendJson(res,200,{ok:true,version:1,outboundNetworkExecutionEnabled:false,tools:contracts.map(c=>({id:c.id,aliases:c.aliases,category:c.category,version:c.version,inputSchema:c.inputSchema,outputSchema:c.outputSchema,riskClass:c.riskClass,executionMode:c.executionMode,networkRequired:c.networkRequired,authRequired:c.authRequired,confirmationRequired:c.confirmationRequired,timeoutMs:c.timeoutMs,maxRetries:c.maxRetries,auditEvent:c.auditEvent,fallback:c.fallback,status:c.status,provenance:c.provenance}))});
  }
  if(method==='POST'&&u.pathname==='/api/tool-fabric/execute'){
    if(!consumeRateLimit(buckets,'tool-fabric:'+userId,60,60000))return sendJson(res,429,{ok:false,error:'tool_rate_limit',retry_after_seconds:60});
    const body=await readJson(req,Math.min(MAX_BODY,1_100_000)),id=String(body.id||'').trim().slice(0,128),contract=getToolContract(id);
    if(!contract)return sendJson(res,404,{ok:false,error:'unknown_tool'});
    const input=body.input===undefined?{}:body.input;
    if(!input||typeof input!=='object'||Array.isArray(input))return sendJson(res,400,{ok:false,error:'tool_input_must_be_object'});
    const started=Date.now();
    const result=await runFabricTool(contract.id,input);
    try{store.addAuditLog({actorUserId:userId,action:'tool_fabric.executed',resourceType:'tool',resourceId:contract.id,metadata:{status:result.status,riskClass:contract.riskClass,executionMode:contract.executionMode,networkUsed:false,durationMs:Date.now()-started,inputFields:Object.keys(input).slice(0,30),outputFields:result.output&&typeof result.output==='object'?Object.keys(result.output).slice(0,30):[]}})}catch{}
    return sendJson(res,200,{ok:true,result,contract:{id:contract.id,status:contract.status,executionMode:contract.executionMode,networkRequired:contract.networkRequired,confirmationRequired:contract.confirmationRequired}});
  }

  if(method==='POST'&&u.pathname==='/api/tool-fabric/pipeline'){
    if(!consumeRateLimit(buckets,'tool-fabric:'+userId,60,60000))return sendJson(res,429,{ok:false,error:'tool_rate_limit',retry_after_seconds:60});
    const body=await readJson(req,Math.min(MAX_BODY,1_100_000));
    const started=Date.now();
    const result=await runFabricPipeline(body);
    const requestedTools=Array.isArray(body?.steps)?body.steps.slice(0,10).map(step=>typeof step?.tool==='string'?step.tool.slice(0,128):'invalid'):[];
    try{
      store.addAuditLog({
        actorUserId:userId,
        action:'tool_fabric.pipeline_executed',
        resourceType:'tool_pipeline',
        resourceId:'pipeline',
        metadata:{
          status:result.status,
          stepCount:requestedTools.length,
          completedSteps:Array.isArray(result.results)?result.results.filter(step=>step.status==='COMPLETED').length:0,
          failedStepId:result.failedStepId||null,
          toolIds:requestedTools,
          networkUsed:false,
          durationMs:Date.now()-started
        }
      });
    }catch{}
    return sendJson(res,200,{ok:true,result});
  }
  if(method==='GET'&&u.pathname==='/api/builder/research')return sendJson(res,200,{ok:true,research:builderResearch()});
  if(method==='GET'&&u.pathname==='/api/cloud/catalog')return sendJson(res,200,{ok:true,services:CLOUD_SERVICE_CATALOG});
  if(/^\/api\/projects\/[^/]+\/discoverability$/.test(u.pathname)&&method==='GET'){const pid=pathParam(u.pathname,'/api/projects/').replace(/\/discoverability$/,'');if(!store.getProject(pid,userId))return sendJson(res,404,{ok:false,error:'project_not_found'});const latest=latestVerifiedWorkspace(pid,userId);if(!latest)return sendJson(res,409,{ok:false,error:'verified_build_required'});const audit=auditDiscoverability(latest.workspace,{baseUrl:publicOrigin(req)});return sendJson(res,200,{ok:true,audit,aeo:aeoSummary(audit),verifiedRunId:latest.run.id});}
  if(/^\/api\/projects\/[^/]+\/discoverability\/audit$/.test(u.pathname)&&method==='POST'){const pid=pathParam(u.pathname,'/api/projects/').replace(/\/discoverability\/audit$/,'');if(!store.getProject(pid,userId))return sendJson(res,404,{ok:false,error:'project_not_found'});const latest=latestVerifiedWorkspace(pid,userId);if(!latest)return sendJson(res,409,{ok:false,error:'verified_build_required'});const audit=auditDiscoverability(latest.workspace,{baseUrl:publicOrigin(req)});store.addEvidence(latest.run.id,'discoverability',audit);return sendJson(res,200,{ok:true,audit,aeo:aeoSummary(audit),verifiedRunId:latest.run.id});}
  if(method==='GET'&&u.pathname==='/api/workspaces')return sendJson(res,200,{ok:true,workspaces:store.listWorkspaces(userId)});
  if(/^\/api\/projects\/[^/]+\/workspace$/.test(u.pathname)&&method==='POST'){const pid=pathParam(u.pathname,'/api/projects/').replace(/\/workspace$/,'');try{requireProjectRole(pid,userId,'admin');}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message})}const current=store.getProject(pid,userId);if(!current)return sendJson(res,404,{ok:false,error:'project_not_found'});const b=await readJson(req,MAX_BODY);try{const saved=store.moveProjectToWorkspace(pid,String(b.workspaceId||''),userId);store.addAuditLog({actorUserId:userId,action:'project.workspace_changed',resourceType:'project',resourceId:pid,metadata:{workspaceId:saved.workspace_id}});return sendJson(res,200,{ok:true,project:{...saved,repo_path:undefined}});}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message});}}
  if(method==='POST'&&u.pathname==='/api/workspaces'){const b=await readJson(req,MAX_BODY);const ws=store.createWorkspace(userId,String(b.name||'Workspace'));store.addAuditLog({actorUserId:userId,action:'workspace.created',resourceType:'workspace',resourceId:ws.id,metadata:{name:ws.name}});return sendJson(res,201,{ok:true,workspace:ws});}
  if(/^\/api\/workspaces\/[^/]+\/members\/[^/]+$/.test(u.pathname)&&method==='PATCH'){const parts=u.pathname.split('/'),wid=parts[3],targetUserId=parts[5];const ws=store.getWorkspace(wid,userId);if(!ws||!canRole(ws.role,'admin'))return sendJson(res,403,{ok:false,error:'workspace_admin_required'});const b=await readJson(req,MAX_BODY);try{const member=store.updateWorkspaceMemberRole(wid,targetUserId,userId,String(b.role||''));store.addAuditLog({actorUserId:userId,action:'workspace.member.role_changed',resourceType:'workspace_member',resourceId:member.id,metadata:{workspaceId:wid,targetUserId,role:member.role}});return sendJson(res,200,{ok:true,member});}catch(e){return sendJson(res,400,{ok:false,error:e.message});}}
  if(/^\/api\/workspaces\/[^/]+\/members\/[^/]+$/.test(u.pathname)&&method==='DELETE'){const parts=u.pathname.split('/'),wid=parts[3],targetUserId=parts[5];const ws=store.getWorkspace(wid,userId);if(!ws||!canRole(ws.role,'admin'))return sendJson(res,403,{ok:false,error:'workspace_admin_required'});try{const result=store.removeWorkspaceMember(wid,targetUserId,userId);store.addAuditLog({actorUserId:userId,action:'workspace.member.removed',resourceType:'workspace_member',resourceId:targetUserId,metadata:{workspaceId:wid}});return sendJson(res,200,{ok:true,...result});}catch(e){return sendJson(res,400,{ok:false,error:e.message});}}
  if(/^\/api\/workspaces\/[^/]+\/members$/.test(u.pathname)&&method==='GET'){const wid=pathParam(u.pathname,'/api/workspaces/').replace(/\/members$/,'');if(!store.getWorkspace(wid,userId))return sendJson(res,404,{ok:false,error:'workspace_not_found'});return sendJson(res,200,{ok:true,members:store.listWorkspaceMembers(wid,userId)});}
  if(/^\/api\/workspaces\/[^/]+\/invites$/.test(u.pathname)&&method==='GET'){const wid=pathParam(u.pathname,'/api/workspaces/').replace(/\/invites$/,'');if(!store.getWorkspace(wid,userId))return sendJson(res,404,{ok:false,error:'workspace_not_found'});return sendJson(res,200,{ok:true,invites:store.listWorkspaceInvites(wid,userId)});}
  if(/^\/api\/workspaces\/[^/]+\/invites$/.test(u.pathname)&&method==='POST'){const wid=pathParam(u.pathname,'/api/workspaces/').replace(/\/invites$/,'');const ws=store.getWorkspace(wid,userId);if(!ws||!canRole(ws.role,'admin'))return sendJson(res,403,{ok:false,error:'workspace_admin_required'});const b=await readJson(req,MAX_BODY),email=String(b.email||'').trim().toLowerCase(),requestedRole=String(b.role||'viewer'),role=['admin','editor','reviewer','viewer'].includes(requestedRole)?requestedRole:'viewer';if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return sendJson(res,400,{ok:false,error:'valid_email_required'});const token=makeInviteToken(),expires=new Date(Date.now()+7*864e5).toISOString(),invite=store.createWorkspaceInvite(wid,email,role,userId,hashInviteToken(token),expires);store.addAuditLog({actorUserId:userId,action:'workspace.invite.created',resourceType:'workspace_invite',resourceId:invite.id,metadata:{workspaceId:wid,email,role}});return sendJson(res,201,{ok:true,invite,token});}
  if(u.pathname==='/api/workspaces/invites/accept'&&method==='POST'){const b=await readJson(req,MAX_BODY);try{const ws=store.acceptWorkspaceInvite(hashInviteToken(String(b.token||'')),userId);store.addAuditLog({actorUserId:userId,action:'workspace.invite.accepted',resourceType:'workspace',resourceId:ws.id,metadata:{}});return sendJson(res,200,{ok:true,workspace:ws});}catch(e){return sendJson(res,400,{ok:false,error:e.message});}}
  if(/^\/api\/workspaces\/[^/]+\/approvals$/.test(u.pathname)&&method==='GET'){const wid=pathParam(u.pathname,'/api/workspaces/').replace(/\/approvals$/,'');if(!store.getWorkspace(wid,userId))return sendJson(res,404,{ok:false,error:'workspace_not_found'});return sendJson(res,200,{ok:true,approvals:store.listWorkspaceApprovals(wid,userId)});}
  if(/^\/api\/workspaces\/[^/]+\/approvals$/.test(u.pathname)&&method==='POST'){const wid=pathParam(u.pathname,'/api/workspaces/').replace(/\/approvals$/,'');const ws=store.getWorkspace(wid,userId);if(!ws||!canRole(ws.role,'editor'))return sendJson(res,403,{ok:false,error:'workspace_editor_required'});const b=await readJson(req,MAX_BODY);try{const approval=store.createWorkspaceApproval(wid,String(b.projectId||''),{runId:b.runId||null,kind:String(b.kind||'publish'),requestedBy:userId,comment:String(b.comment||'')});store.addAuditLog({actorUserId:userId,action:'workspace.approval.requested',resourceType:'approval',resourceId:approval.id,metadata:{workspaceId:wid,projectId:b.projectId,kind:b.kind||'publish'}});return sendJson(res,201,{ok:true,approval});}catch(e){return sendJson(res,400,{ok:false,error:e.message});}}
  if(/^\/api\/approvals\/[^/]+\/decision$/.test(u.pathname)&&method==='POST'){const id=pathParam(u.pathname,'/api/approvals/').replace(/\/decision$/,'');const b=await readJson(req,MAX_BODY);try{const approval=store.decideWorkspaceApproval(id,userId,String(b.status||''),String(b.comment||''));store.addAuditLog({actorUserId:userId,action:'workspace.approval.decided',resourceType:'approval',resourceId:id,metadata:{status:b.status}});return sendJson(res,200,{ok:true,approval});}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message});}}
  if(/^\/api\/projects\/[^/]+\/design$/.test(u.pathname)&&method==='GET'){const pid=pathParam(u.pathname,'/api/projects/').replace(/\/design$/,'');if(!store.getProject(pid,userId))return sendJson(res,404,{ok:false,error:'project_not_found'});let ds=store.getDesignSystem(pid,userId);if(!ds){ds=store.upsertDesignSystem(pid,userId,{system:normalizeDesignSystem({},'')});}return sendJson(res,200,{ok:true,designSystem:ds,contract:designModeContract(ds.system)});}
  if(/^\/api\/projects\/[^/]+\/design$/.test(u.pathname)&&method==='PUT'){const pid=pathParam(u.pathname,'/api/projects/').replace(/\/design$/,'');try{requireProjectRole(pid,userId,'editor');}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message})}const b=await readJson(req,MAX_BODY);try{const ds=store.upsertDesignSystem(pid,userId,{name:String(b.name||'Build Vibe Design System'),system:normalizeDesignSystem(b.system||b.tokens||{},String(b.request||''))});store.addAuditLog({actorUserId:userId,action:'design_system.updated',resourceType:'project',resourceId:pid,metadata:{version:ds.version}});return sendJson(res,200,{ok:true,designSystem:ds,contract:designModeContract(ds.system)});}catch(e){return sendJson(res,400,{ok:false,error:e.message});}}
  if(/^\/api\/projects\/[^/]+\/domains$/.test(u.pathname)&&method==='GET'){const pid=pathParam(u.pathname,'/api/projects/').replace(/\/domains$/,'');if(!store.getProject(pid,userId))return sendJson(res,404,{ok:false,error:'project_not_found'});return sendJson(res,200,{ok:true,domains:store.listDomains(pid,userId)});}
    if(/^\/api\/projects\/[^/]+\/domains\/[^/]+\/verify$/.test(u.pathname)&&method==='POST'){const parts=u.pathname.split('/'),pid=parts[3],domain=decodeURIComponent(parts[5]);try{requireProjectRole(pid,userId,'admin');}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message})}if(!store.getProject(pid,userId))return sendJson(res,404,{ok:false,error:'project_not_found'});try{const records=await resolveAny(domain);const hasAddress=records.some(r=>r.type==='A'||r.type==='AAAA'||r.type==='CNAME');const next=store.updateDomain(pid,userId,domain,{status:hasAddress?'verified':'pending',verification_json:{records,checkedAt:new Date().toISOString()}});return sendJson(res,200,{ok:true,domain:next,verified:hasAddress,records});}catch(e){const next=store.updateDomain(pid,userId,domain,{status:'pending',verification_json:{error:String(e.message||e).slice(0,300),checkedAt:new Date().toISOString()}});return sendJson(res,200,{ok:true,domain:next,verified:false,error:String(e.message||e).slice(0,300)});}}
  if(/^\/api\/projects\/[^/]+\/domains$/.test(u.pathname)&&method==='POST'){const pid=pathParam(u.pathname,'/api/projects/').replace(/\/domains$/,'');try{requireProjectRole(pid,userId,'admin');}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message})}const b=await readJson(req,MAX_BODY),provider=String(b.provider||'vercel'),domain=String(b.domain||'').trim().toLowerCase();try{const d=store.upsertDomain(pid,userId,domain,provider,domainVerificationInstructions(domain,provider));return sendJson(res,201,{ok:true,domain:d,instructions:domainVerificationInstructions(domain,provider)});}catch(e){return sendJson(res,400,{ok:false,error:e.message});}}
  if(/^\/api\/projects\/[^/]+\/cloud-services$/.test(u.pathname)&&method==='GET'){const pid=pathParam(u.pathname,'/api/projects/').replace(/\/cloud-services$/,'');if(!store.getProject(pid,userId))return sendJson(res,404,{ok:false,error:'project_not_found'});return sendJson(res,200,{ok:true,services:store.listCloudServices(pid,userId),catalog:CLOUD_SERVICE_CATALOG});}
  if(/^\/api\/projects\/[^/]+\/cloud-services$/.test(u.pathname)&&method==='POST'){const pid=pathParam(u.pathname,'/api/projects/').replace(/\/cloud-services$/,'');try{requireProjectRole(pid,userId,'admin');}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message})}const b=await readJson(req,MAX_BODY);try{const service=await provisionCloudService({store,userId,projectId:pid,type:String(b.type||''),config:b.config&&typeof b.config==='object'?b.config:{}});return sendJson(res,200,{ok:true,service});}catch(e){return sendJson(res,400,{ok:false,error:e.message});}}
  if(/^\/api\/projects\/[^/]+\/content\/revisions$/.test(u.pathname)&&method==='GET'){const pid=pathParam(u.pathname,'/api/projects/').replace(/\/content\/revisions$/,'');if(!store.getProject(pid,userId))return sendJson(res,404,{ok:false,error:'project_not_found'});return sendJson(res,200,{ok:true,revisions:store.listContentRevisions(pid,userId)});}
  if(/^\/api\/projects\/[^/]+\/content\/revisions$/.test(u.pathname)&&method==='POST'){const pid=pathParam(u.pathname,'/api/projects/').replace(/\/content\/revisions$/,'');try{requireProjectRole(pid,userId,'editor');}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message})}const b=await readJson(req,MAX_BODY);const content=b.content&&typeof b.content==='object'?b.content:store.getProjectContent(pid,userId)||{};try{return sendJson(res,201,{ok:true,revision:store.createContentRevision(pid,userId,content,String(b.status||'draft'))});}catch(e){return sendJson(res,400,{ok:false,error:e.message});}}
  if(/^\/api\/content-revisions\/[^/]+\/publish$/.test(u.pathname)&&method==='POST'){const id=pathParam(u.pathname,'/api/content-revisions/').replace(/\/publish$/,'');const revisionRow=store.getContentRevision(id,userId);if(!revisionRow)return sendJson(res,404,{ok:false,error:'revision_not_found'});try{requireProjectRole(revisionRow.project_id,userId,'editor');}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message})}try{const revision=store.publishContentRevision(id,userId);return sendJson(res,200,{ok:true,revision});}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message});}}
  if(/^\/api\/projects\/[^/]+\/research$/.test(u.pathname)&&method==='GET'){const pid=pathParam(u.pathname,'/api/projects/').replace(/\/research$/,'');if(!store.getProject(pid,userId))return sendJson(res,404,{ok:false,error:'project_not_found'});return sendJson(res,200,{ok:true,runs:store.listResearchRuns(pid,userId)});}
  if(/^\/api\/projects\/[^/]+\/research$/.test(u.pathname)&&method==='POST'){const pid=pathParam(u.pathname,'/api/projects/').replace(/\/research$/,'');try{requireProjectRole(pid,userId,'editor');}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message})}if(!store.getProject(pid,userId))return sendJson(res,404,{ok:false,error:'project_not_found'});const b=await readJson(req,MAX_BODY),query=String(b.query||'').trim();if(!query)return sendJson(res,400,{ok:false,error:'query_required'});const result=await researchWeb(query,{limit:Math.min(12,Math.max(1,Number(b.limit)||8))});const saved=store.createResearchRun(pid,userId,{query,provider:result.provider,status:result.status||'completed',results:result.results});if(b.runId&&store.getRun(String(b.runId),userId))store.addEvidence(String(b.runId),'web_research',{query,provider:result.provider,results:result.results});return sendJson(res,200,{ok:true,research:result,run:saved});}

  if(method==='POST'&&u.pathname==='/api/builder/blueprint'){const b=await readJson(req,MAX_BODY);const request=String(b.request||'').trim();if(!request)return sendJson(res,400,{ok:false,error:'request_required'});return sendJson(res,200,{ok:true,blueprint:buildBlueprint(request,{targetId:String(b.target||'auto')})});}
  if(method==='GET'&&u.pathname==='/api/billing'){const billing=store.getBilling(userId),usage=store.monthlyUsage(userId,currentPeriodKey());const plan=getPlan(billing.plan);return sendJson(res,200,{ok:true,billing:{...billing,stripe_customer_id:undefined,stripe_subscription_id:undefined,provider_customer_id:undefined,provider_subscription_id:undefined,provider_transaction_id:undefined,customerConfigured:Boolean(billing.stripe_customer_id||billing.provider_customer_id)},plan,usage,plans:planCatalog(),features:plan.features,billingProvider:String(billing.billing_provider||process.env.CODINGVIBES_BILLING_PROVIDER||'stripe')});}
  if(method==='GET'&&u.pathname==='/api/features'){const billing=store.getBilling(userId),plan=getPlan(billing.plan);return sendJson(res,200,{ok:true,plan:plan.id,features:plan.features,all:planCatalog().flatMap(x=>x.featureCatalog||[]).filter((x,i,a)=>a.findIndex(y=>y.id===x.id)===i).map(x=>({...x,enabled:hasFeature(plan.id,x.id)}))});}
  if(method==='POST'&&u.pathname==='/api/billing/checkout'){
    const b=await readJson(req,MAX_BODY),plan=getPlan(String(b.plan||'pro')),provider=String(process.env.CODINGVIBES_BILLING_PROVIDER||'stripe').trim().toLowerCase(),email=store.getUser(userId)?.email;const base=publicOrigin(req);const successUrl=normalizeReturnUrl(b.successUrl,`${base}/?billing=success`),cancelUrl=normalizeReturnUrl(b.cancelUrl,`${base}/?billing=cancel`);
    if(plan.id==='free'||!plan.priceEnv)return sendJson(res,400,{ok:false,error:'plan_not_billable'});
    try{
      if(provider==='stripe'){
        const priceId=process.env[plan.priceEnv];if(!priceId)return sendJson(res,400,{ok:false,error:'stripe_price_not_configured'});
        const checkout=await createCheckoutSession({apiKey:process.env.STRIPE_SECRET_KEY,priceId,customerEmail:email,clientReferenceId:userId,plan:plan.id,successUrl,cancelUrl});
        store.updateBilling(userId,{billing_provider:'stripe'});
        return sendJson(res,200,{ok:true,provider,checkout});
      }
      if(provider==='paddle'){
        const priceEnv=plan.paddlePriceEnv,priceId=priceEnv?process.env[priceEnv]:'';if(!priceId)return sendJson(res,400,{ok:false,error:'paddle_price_not_configured'});
        const billing=store.getBilling(userId);let customerId=billing.provider_customer_id;
        if(!customerId){const customer=await createPaddleCustomer({email,userId});customerId=customer.id;store.updateBilling(userId,{billing_provider:'paddle',provider_customer_id:customerId});}
        const checkout=await createPaddleCheckoutTransaction({priceId,email,userId,plan:plan.id,successUrl,cancelUrl,customerId});
        store.updateBilling(userId,{billing_provider:'paddle',provider_customer_id:checkout.customerId||customerId,provider_transaction_id:checkout.id});
        return sendJson(res,200,{ok:true,provider,checkout});
      }
      return sendJson(res,503,{ok:false,error:'unsupported_billing_provider'});
    }catch(e){return sendJson(res,503,{ok:false,error:e.message});}
  }
  if(method==='POST'&&u.pathname==='/api/billing/portal'){
    const billing=store.getBilling(userId),provider=String(billing.billing_provider||process.env.CODINGVIBES_BILLING_PROVIDER||'stripe').trim().toLowerCase(),base=publicOrigin(req);
    try{
      if(provider==='stripe'){
        const id=String(billing.stripe_customer_id||'').trim();if(!id)return sendJson(res,409,{ok:false,error:'stripe_customer_missing'});
        const portal=await createCustomerPortalSession({apiKey:process.env.STRIPE_SECRET_KEY,customerId:id,returnUrl:normalizeReturnUrl('',`${base}/app`)});return sendJson(res,200,{ok:true,provider,portal});
      }
      if(provider==='paddle'){
        const id=String(billing.provider_customer_id||'').trim();if(!id)return sendJson(res,409,{ok:false,error:'paddle_customer_missing'});
        const portal=await createPaddlePortalSession({customerId:id,subscriptionId:billing.provider_subscription_id||null});return sendJson(res,200,{ok:true,provider,portal});
      }
      return sendJson(res,503,{ok:false,error:'unsupported_billing_provider'});
    }catch(e){return sendJson(res,503,{ok:false,error:e.message});}
  }
  if(method==='GET'&&u.pathname==='/api/model/status'){const r=userRouter(userId);return sendJson(res,200,{ok:true,...r.getStatus()});}
  if(method==='GET'&&u.pathname==='/api/connectors'){const r=userRouter(userId);return sendJson(res,200,{ok:true,connectors:r.listConnectors(),chain:r.getStatus().chain});}
  if(method==='POST'&&u.pathname==='/api/connectors/test'){const b=await readJson(req,MAX_BODY),r=userRouter(userId);return sendJson(res,200,await r.testConnection(String(b.provider||'')));}
  if(method==='GET'&&u.pathname==='/api/ai/providers'){const r=userRouter(userId);return sendJson(res,200,{ok:true,providers:r.listConnectors(),settings:store.getAiSettings(userId)});}
  if(method==='POST'&&u.pathname==='/api/ai/providers/connect'){
    try{
      const input=providerConnectionInput(await readJson(req,MAX_BODY));
      const secret=encryptSecret(JSON.stringify({apiKey:input.apiKey,baseUrl:input.baseUrl}));
      store.upsertProviderConnection(userId,input.provider,secret,{defaultModel:input.defaultModel,enabled:true});
      store.addAuditLog({actorUserId:userId,action:'ai.provider.connected',resourceType:'ai_provider',resourceId:input.provider,metadata:{provider:input.provider}});
      const r=userRouter(userId),provider=r.listConnectors().find(x=>x.id===input.provider);
      return sendJson(res,200,{ok:true,provider});
    }catch(e){return sendJson(res,e.status||400,{ok:false,error:e.message});}
  }
  if(/^\/api\/ai\/providers\/[^/]+$/.test(u.pathname)&&method==='DELETE'){
    const provider=canonicalProvider(pathParam(u.pathname,'/api/ai/providers/'));store.deleteProviderConnection(userId,provider);store.addAuditLog({actorUserId:userId,action:'ai.provider.disconnected',resourceType:'ai_provider',resourceId:provider,metadata:{provider}});return sendJson(res,200,{ok:true,provider});
  }
  if(/^\/api\/ai\/providers\/[^/]+\/test$/.test(u.pathname)&&method==='POST'){
    const provider=canonicalProvider(pathParam(u.pathname,'/api/ai/providers/').replace(/\/test$/,''));const r=userRouter(userId);return sendJson(res,200,await r.testConnection(provider));
  }
  if(method==='PUT'&&u.pathname==='/api/ai/settings'){
    try{const input=normalizeAiSettings(await readJson(req,MAX_BODY));const saved=store.updateAiSettings(userId,input);store.addAuditLog({actorUserId:userId,action:'ai.settings.updated',resourceType:'ai_settings',metadata:{primary:input.primary,chain:input.chain}});return sendJson(res,200,{ok:true,settings:saved});}catch(e){return sendJson(res,e.status||400,{ok:false,error:e.message});}
  }
  if(method==='GET'&&u.pathname==='/api/ai/tokens')return sendJson(res,200,{ok:true,tokens:store.listApiTokens(userId)});
  if(method==='POST'&&u.pathname==='/api/ai/tokens'){
    const existing=store.listApiTokens(userId).filter(x=>!x.revoked_at);if(existing.length>=10)return sendJson(res,409,{ok:false,error:'token_limit_reached'});
    const b=await readJson(req,MAX_BODY),created=createApiToken(),saved=store.createApiToken(userId,{name:String(b.name||'Build Vibe integration'),hash:created.hash,prefix:created.prefix});store.addAuditLog({actorUserId:userId,action:'ai.token.created',resourceType:'api_token',resourceId:saved.id,metadata:{name:saved.name}});return sendJson(res,201,{ok:true,token:created.token,tokenInfo:saved});
  }
  if(/^\/api\/ai\/tokens\/[^/]+$/.test(u.pathname)&&method==='DELETE'){
    const id=pathParam(u.pathname,'/api/ai/tokens/');const saved=store.revokeApiToken(id,userId);if(!saved)return sendJson(res,404,{ok:false,error:'token_not_found'});store.addAuditLog({actorUserId:userId,action:'ai.token.revoked',resourceType:'api_token',resourceId:id,metadata:{}});return sendJson(res,200,{ok:true,tokenInfo:saved});
  }
  if(method==='GET'&&u.pathname==='/api/integrations')return sendJson(res,200,{ok:true,integrations:listIntegrationDefinitions()});
  if(method==='POST'&&u.pathname==='/api/integrations/test'){const b=await readJson(req,MAX_BODY);return sendJson(res,200,await testIntegration(String(b.integration||'')));}
  if(method==='POST'&&u.pathname==='/api/integrations/github/import'){const b=await readJson(req,MAX_BODY);let project=null;try{project=store.createProject(userId,{name:String(b.projectName||`${String(b.owner||'')}/${String(b.repo||'')}`).slice(0,80)||'Imported GitHub project'});const imported=await importGitHubRepository({owner:b.owner,repo:b.repo,ref:b.ref,projectName:project.name});const saved=store.updateProjectRepo(project.id,imported.repoPath);return sendJson(res,201,{ok:true,project:{...saved,repo_path:undefined},source:{owner:imported.owner,repo:imported.repo,ref:imported.ref,branch:imported.branch}});}catch(e){if(project)store.deleteProject(project.id,userId);return sendJson(res,400,{ok:false,error:e.message});}}
  if(method==='GET'&&u.pathname==='/api/launch/status'){
    const ready=readiness({router:userRouter(userId)}),billing=store.getBilling(userId),usage=store.monthlyUsage(userId,currentPeriodKey());
    const plans=planCatalog().map(p=>({id:p.id,label:p.label,priceUsd:p.priceUsd||0,monthlyRuns:p.monthlyRuns,monthlyTokens:p.monthlyTokens,features:p.features}));
    const connectedProviders=store.listProviderConnections(userId).map(x=>x.provider);
    const targets=listTargets().map(t=>({...t,execution:targetExecutionAvailability(getTarget(t.id))}));
    return sendJson(res,200,{ok:true,ready,billing:{plan:billing.plan,status:billing.status,usage},plans,providers:deploymentCatalog(),connectedProviders,targets});
  }
  if(method==='GET'&&u.pathname==='/api/fleet')return sendJson(res,200,{ok:true,version:CODINGVIBES_VERSION,...fleetStatus(store)});
  if(method==='GET'&&u.pathname==='/api/targets/availability')return sendJson(res,200,{ok:true,targets:listTargets().map(t=>({...t,execution:targetExecutionAvailability(getTarget(t.id))}))});
    if(method==='GET'&&u.pathname==='/api/targets')return sendJson(res,200,{ok:true,targets:listTargets()});
  if(method==='GET'&&u.pathname==='/api/projects')return sendJson(res,200,{ok:true,projects:store.listProjects(userId)});
  if(/^\/api\/projects\/[^/]+\/capabilities$/.test(u.pathname)&&method==='GET'){
    const pid=pathParam(u.pathname,'/api/projects/').replace(/\/capabilities$/,'');
    try{
      const {project,role}=requireProjectRole(pid,userId,'viewer');
      const billing=store.getBilling(userId),latest=latestVerifiedWorkspace(pid,userId),connections=store.listProviderConnections(userId).map(x=>x.provider);
      return sendJson(res,200,{ok:true,capabilities:projectCapabilityMatrix({role,plan:billing.plan,verified:Boolean(latest),providers:connections,cloudConfigured:Boolean(process.env.CODINGVIBES_CLOUD_API_URL||process.env.CODINGVIBES_HOSTING_API_URL)}),projectId:project.id});
    }catch(e){return sendJson(res,e.status||404,{ok:false,error:e.message});}
  }
  if(method==='GET'&&u.pathname==='/api/deployment/providers')return sendJson(res,200,{ok:true,providers:deploymentCatalog(),connected:store.listProviderConnections(userId)});
  if(/^\\/api\\/deployment\\/providers\\/[^/]+\\/verify$/.test(u.pathname)&&method==='POST'){
    const provider=pathParam(u.pathname,'/api/deployment/providers/').replace(/\\/verify$/,'');
    try{
      const verification=await authenticateProvider({store,userId,provider});
      return sendJson(res,200,{ok:true,verification});
    }catch(e){return sendJson(res,e.status||400,{ok:false,error:e.message})}
  }
  if(/^\/api\/deployment\/providers\/[^/]+\/oauth$/.test(u.pathname)&&method==='GET'){const provider=pathParam(u.pathname,'/api/deployment/providers/').replace(/\/oauth$/,'');try{const location=beginOAuth(store,provider,{userId,redirectAfter:'/app'});res.writeHead(302,{location});res.end();return;}catch(e){return sendJson(res,e.status||503,{ok:false,error:e.message})}}
  if(/^\/api\/deployment\/oauth\/[^/]+\/callback$/.test(u.pathname)&&method==='GET'){const provider=pathParam(u.pathname,'/api/deployment/oauth/').replace(/\/callback$/,'');try{const result=await completeOAuth(store,provider,{code:u.searchParams.get('code'),state:u.searchParams.get('state')});if(result.userId!==userId)throw Object.assign(new Error('oauth_user_mismatch'),{status:403});connectProvider(store,userId,provider,{secret:result.secret,metadata:result.metadata});res.writeHead(302,{location:'/app?deployment=connected&provider='+encodeURIComponent(provider)});res.end();return;}catch(e){res.writeHead(302,{location:'/app?deployment=error&provider='+encodeURIComponent(provider)+'&message='+encodeURIComponent(String(e.message||e).slice(0,240))});res.end();return}}

  if(/^\/api\/deployment\/providers\/[^/]+\/connect$/.test(u.pathname)&&method==='POST'){if(process.env.CODINGVIBES_ALLOW_TOKEN_CONNECT!=='true')return sendJson(res,409,{ok:false,error:'oauth_required'});const provider=pathParam(u.pathname,'/api/deployment/providers/').replace(/\/connect$/,'');const b=await readJson(req,MAX_BODY);try{return sendJson(res,200,{ok:true,connection:connectProvider(store,userId,provider,{secret:String(b.secret||''),metadata:b.metadata&&typeof b.metadata==='object'?b.metadata:{}})})}catch(e){return sendJson(res,e.status||400,{ok:false,error:e.message})}}
  if(/^\/api\/deployment\/providers\/[^/]+$/.test(u.pathname)&&method==='DELETE'){const provider=pathParam(u.pathname,'/api/deployment/providers/');return sendJson(res,200,{ok:true,connection:disconnectProvider(store,userId,provider)})}
  if(/^\/api\/deployments\/[^/]+$/.test(u.pathname)&&method==='GET'){const id=pathParam(u.pathname,'/api/deployments/');const row=store.getDeployment(id,userId);if(!row)return sendJson(res,404,{ok:false,error:'deployment_not_found'});try{requireProjectRole(row.project_id,userId,'viewer');}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message})}try{return sendJson(res,200,{ok:true,deployment:await getDeploymentStatus({store,userId,deploymentId:id})})}catch(e){const row=store.getDeployment(id,userId);return sendJson(res,e.status||404,{ok:false,error:e.message,deployment:row||null})}}
  if(/^\/api\/deployments\/[^/]+\/cancel$/.test(u.pathname)&&method==='POST'){const id=pathParam(u.pathname,'/api/deployments/').replace(/\/cancel$/,'');const row=store.getDeployment(id,userId);if(!row)return sendJson(res,404,{ok:false,error:'deployment_not_found'});try{requireProjectRole(row.project_id,userId,'editor');}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message})}try{return sendJson(res,200,{ok:true,result:await cancelDeployment({store,userId,deploymentId:id})})}catch(e){return sendJson(res,e.status||409,{ok:false,error:e.message})}}
  if(/^\/api\/projects\/[^/]+\/deployments$/.test(u.pathname)&&method==='GET'){const projectId=pathParam(u.pathname,'/api/projects/');if(!store.getProject(projectId,userId))return sendJson(res,404,{ok:false,error:'project_not_found'});return sendJson(res,200,{ok:true,deployments:store.listDeployments(projectId,userId)})}
  if(/^\/api\/projects\/[^/]+\/artifact$/.test(u.pathname)&&method==='GET'){const projectId=pathParam(u.pathname,'/api/projects/');const project=store.getProject(projectId,userId);if(!project)return sendJson(res,404,{ok:false,error:'project_not_found'});const latest=latestVerifiedWorkspace(projectId,userId);if(!latest)return sendJson(res,409,{ok:false,error:'verified_build_required'});try{const artifact=await prepareDeploymentArtifact({...project,repo_path:latest.workspace});return sendJson(res,200,{ok:true,artifact:{...artifact,root:undefined},verifiedRunId:latest.run.id})}catch(e){return sendJson(res,e.status||409,{ok:false,error:e.message})}}
  if(/^\/api\/projects\/[^/]+\/deploy$/.test(u.pathname)&&method==='POST'){const projectId=pathParam(u.pathname,'/api/projects/');try{requireProjectRole(projectId,userId,'editor');}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message})}const project=store.getProject(projectId,userId);if(!project)return sendJson(res,404,{ok:false,error:'project_not_found'});const latest=latestVerifiedWorkspace(projectId,userId);if(!latest)return sendJson(res,409,{ok:false,error:'verified_build_required'});syncDeploymentContent(projectId,userId,latest.workspace);const b=await readJson(req,MAX_BODY),provider=String(b.provider||'');if(!provider)return sendJson(res,400,{ok:false,error:'provider_required'});try{const result=await deployProject({store,userId,project:{...project,repo_path:latest.workspace},provider,options:{...(b.options||{}),commitSha:b.commitSha||undefined,targetId:latest.run.target_id||'web-node',verification:{passed:true,scope:'verified-run',runId:latest.run.id}}});const indexNow=result.deployment.url?await notifyIndexNow(result.deployment.url,latest.workspace):{ok:false,skipped:true,reason:'deployment_url_missing'};store.addAuditLog({actorUserId:userId,action:'deployment.created',resourceType:'deployment',resourceId:result.deployment.id,metadata:{projectId:projectId,provider,status:result.deployment.status,indexNow:indexNow.ok?'submitted':(indexNow.reason||indexNow.error||'not_submitted')}});store.addEvidence(latest.run.id,'deployment',{provider,deploymentId:result.deployment.id,status:result.deployment.status,url:result.deployment.url,artifactFingerprint:result.deployment.metadata?.artifactFingerprint,indexNow:indexNow});return sendJson(res,200,{ok:true,deployment:result.deployment,indexNow,artifact:{framework:result.artifact.framework,packageManager:result.artifact.packageManager,buildCommand:result.artifact.buildCommand,outputDirectory:result.artifact.outputDirectory,serverRequired:result.artifact.deploymentMetadata.serverRequired},verifiedRunId:latest.run.id})}catch(e){return sendJson(res,e.status||409,{ok:false,error:e.message,deployment:{provider,status:'failed'}})}}
  if(/^\/api\/deployments\/[^/]+\/file$/.test(u.pathname)&&method==='GET'){const id=pathParam(u.pathname,'/api/deployments/').replace(/\/file$/,'');const d=store.getDeployment(id,userId);if(!d||d.provider!=='manual'||!d.deployment_id)return sendJson(res,404,{ok:false,error:'export_not_found'});const file=path.resolve(d.deployment_id),root=path.resolve(process.env.CODINGVIBES_EXPORT_ROOT||path.join(process.cwd(),'data','exports'));if(!(file===root||file.startsWith(root+path.sep))||!fs.existsSync(file))return sendJson(res,404,{ok:false,error:'export_file_not_found'});const stat=fs.statSync(file);res.writeHead(200,{'content-type':'application/zip','content-length':String(stat.size),'content-disposition':'attachment; filename="'+path.basename(file).replace(/[^a-zA-Z0-9._-]/g,'_')+'"','cache-control':'private, no-store'});fs.createReadStream(file).pipe(res);return}
  if(/^\/api\/projects\/[^/]+\/assets\/[^/]+\/attach$/.test(u.pathname)&&method==='POST'){
    const parts=u.pathname.split('/'),projectId=parts[3],assetId=parts[5];try{requireProjectRole(projectId,userId,'editor');}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message})}const project=store.getProject(projectId,userId);if(!project)return sendJson(res,404,{ok:false,error:'project_not_found'});const asset=store.getProjectAsset(assetId,projectId,userId);if(!asset)return sendJson(res,404,{ok:false,error:'asset_not_found'});const b=await readJson(req,MAX_BODY),collection=String(b.collection||''),recordId=String(b.recordId||''),mode=String(b.mode||asset.kind);let content=store.getProjectContent(projectId,userId);if(!content)return sendJson(res,409,{ok:false,error:'project_content_not_initialized'});let patch={};const ref={assetId:asset.id,url:asset.public_path,poster:'',alt:asset.name,scale:1};
    if(collection==='products'){if(mode==='image')patch={images:[...(content.products.find(x=>x.id===recordId)?.images||[]),asset.public_path]};else if(mode==='video')patch={video:ref};else if(mode==='model')patch={model:ref};else return sendJson(res,400,{ok:false,error:'unsupported_product_asset_mode'});}
    else if(collection==='scenes'){if(mode==='poster'||mode==='image')patch={poster:ref};else if(mode==='video')patch={video:ref};else if(mode==='model')patch={model:ref};else return sendJson(res,400,{ok:false,error:'unsupported_scene_asset_mode'});}
    else if(collection==='properties'){if(mode==='image')patch={images:[...(content.properties.find(x=>x.id===recordId)?.images||[]),asset.public_path]};else if(mode==='video')patch={video:ref};else if(mode==='model')patch={model:ref};else if(mode==='poster'||mode==='floorplan')patch={floorplan:ref};else return sendJson(res,400,{ok:false,error:'unsupported_property_asset_mode'});}
    else return sendJson(res,400,{ok:false,error:'asset_attachment_collection_unsupported'});
    try{content=applyContentOperation(content,{type:'update',collection,id:recordId,patch},{kind:content.kit});content.meta={...(content.meta||{}),managed:true};content=store.upsertProjectContent(projectId,userId,content);syncProjectContent(projectId,userId,content);return sendJson(res,200,{ok:true,content,asset,attached:{collection,recordId,mode}});}catch(e){return sendJson(res,400,{ok:false,error:e.message});}
  }
  if(/^\/api\/projects\/[^/]+\/assets$/.test(u.pathname)&&method==='GET'){
    const projectId=pathParam(u.pathname,'/api/projects/');if(!store.getProject(projectId,userId))return sendJson(res,404,{ok:false,error:'project_not_found'});const kind=u.searchParams.get('kind')||'',role=u.searchParams.get('role')||'';const assets=store.listProjectAssets(projectId,userId).filter(a=>(!kind||a.kind===kind)&&(!role||a.role===role));return sendJson(res,200,{ok:true,assets});
  }
  if(/^\/api\/projects\/[^/]+\/assets$/.test(u.pathname)&&method==='POST'){
    const projectId=pathParam(u.pathname,'/api/projects/');try{requireProjectRole(projectId,userId,'editor');}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message})}const project=store.getProject(projectId,userId);if(!project)return sendJson(res,404,{ok:false,error:'project_not_found'});
    const name=String(req.headers['x-asset-name']||'asset'),mime=String(req.headers['content-type']||'application/octet-stream'),role=String(req.headers['x-asset-role']||'other');let metadata={};try{metadata=JSON.parse(String(req.headers['x-asset-meta']||'{}'))}catch{}
    const sizeHeader=Number(req.headers['content-length']||0);if(!sizeHeader)return sendJson(res,400,{ok:false,error:'content_length_required'});const gate=validateAssetUpload({name,mime,size:sizeHeader});if(!gate.ok)return sendJson(res,gate.error==='asset_too_large'?413:400,{ok:false,error:gate.error});
    const body=await readRawBuffer(req,MAX_ASSET_BYTES),size=body.length,finalGate=validateAssetUpload({name,mime,size});if(!finalGate.ok)return sendJson(res,finalGate.error==='asset_too_large'?413:400,{ok:false,error:finalGate.error});
    const id=randomUUID(),safe=safeAssetName(name),filename=id+'-'+safe,absolute=resolveInside(project.repo_path,path.join('public','assets',filename),{forWrite:true});fs.mkdirSync(path.dirname(absolute),{recursive:true});fs.writeFileSync(absolute,body);const sha256=hashBuffer(body);const publicPath='/assets/'+filename;const record=store.createProjectAsset(projectId,userId,{id,name,mime,kind:assetType({name,mime}),role,size,sha256,publicPath,metadata});return sendJson(res,201,{ok:true,asset:makeAssetRecord({id:record.id,name:record.name,mime:record.mime,size:record.size,sha256:record.sha256,role:record.role,publicPath:record.public_path,metadata:record.metadata})});
  }
  if(/^\/api\/projects\/[^/]+\/assets\/[^/]+$/.test(u.pathname)&&method==='DELETE'){
    const parts=u.pathname.split('/'),projectId=parts[3],assetId=parts[5];try{requireProjectRole(projectId,userId,'editor');}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message})}const project=store.getProject(projectId,userId);if(!project)return sendJson(res,404,{ok:false,error:'project_not_found'});const asset=store.deleteProjectAsset(assetId,projectId,userId);if(!asset)return sendJson(res,404,{ok:false,error:'asset_not_found'});const file=resolveInside(project.repo_path,path.join('public','assets',path.basename(asset.public_path)));try{if(fs.existsSync(file))fs.unlinkSync(file)}catch{}return sendJson(res,200,{ok:true,asset});
  }
  if(/^\/api\/projects\/[^/]+\/assets\/[^/]+\/file$/.test(u.pathname)&&method==='GET'){
    const parts=u.pathname.split('/'),projectId=parts[3],assetId=parts[5];const project=store.getProject(projectId,userId);if(!project)return sendJson(res,404,{ok:false,error:'project_not_found'});const asset=store.getProjectAsset(assetId,projectId,userId);if(!asset)return sendJson(res,404,{ok:false,error:'asset_not_found'});const file=path.resolve(project.repo_path,'public','assets',path.basename(asset.public_path));const assetRoot=path.resolve(project.repo_path,'public','assets');if(!(file===assetRoot||file.startsWith(assetRoot+path.sep))||!fs.existsSync(file))return sendJson(res,404,{ok:false,error:'asset_file_not_found'});const stat=fs.statSync(file);if(stat.size!==asset.size)return sendJson(res,409,{ok:false,error:'asset_size_changed'});res.writeHead(200,{'content-type':asset.mime,'content-length':String(stat.size),'content-disposition':'attachment; filename="'+safeAssetName(asset.name)+'"','cache-control':'private, no-store'});fs.createReadStream(file).pipe(res);return;
  }
  if(/^\/api\/runs\/[^/]+\/visual-baseline$/.test(u.pathname)&&method==='POST'){
    const runId=pathParam(u.pathname,'/api/runs/').replace(/\/visual-baseline$/,'');const run=store.getRun(runId,userId);if(!run)return sendJson(res,404,{ok:false,error:'not_found'});const runSession=store.getSession(run.session_id,userId);if(!runSession)return sendJson(res,404,{ok:false,error:'session_not_found'});try{requireProjectRole(runSession.project_id,userId,'editor');}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message})}const b=await readJson(req,MAX_BODY);if(!b.confirmed)return sendJson(res,400,{ok:false,error:'explicit_confirmation_required'});const session=store.getSession(run.session_id,userId),projectId=session?.project_id;if(!projectId)return sendJson(res,409,{ok:false,error:'project_not_found'});const verification=store.listEvidence(runId).filter(x=>x.type==='verification').at(-1)?.payload;const results=verification?.browser?.results||[];if(!results.length)return sendJson(res,409,{ok:false,error:'no_visual_results'});
    const root=path.resolve(process.env.CODINGVIBES_VISUAL_BASELINE_ROOT||path.join(process.cwd(),'data','visual-baselines'),projectId);fs.mkdirSync(root,{recursive:true});const saved=[];
    for(const item of results){if(!item.screenshot||!fs.existsSync(item.screenshot))continue;const dest=baselinePath(root,item.path);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(item.screenshot,dest);const sha=createHash('sha256').update(fs.readFileSync(dest)).digest('hex');const base=store.upsertVisualBaseline(projectId,userId,{route:item.path,storedPath:dest,size:fs.statSync(dest).size,sha256:sha,width:item.visual?.width||item.ui?.documentWidth||null,height:item.visual?.height||null});saved.push({...base,stored_path:undefined});}
    store.addEvidence(runId,'visual_baseline_approved',{projectId,routes:saved.map(x=>x.route),count:saved.length});return sendJson(res,saved.length?200:409,{ok:Boolean(saved.length),baselines:saved});
  }
  if(/^\/api\/projects\/[^/]+\/visual-baselines$/.test(u.pathname)&&method==='GET'){
    const projectId=pathParam(u.pathname,'/api/projects/');if(!store.getProject(projectId,userId))return sendJson(res,404,{ok:false,error:'project_not_found'});return sendJson(res,200,{ok:true,baselines:store.listVisualBaselines(projectId,userId)});
  }
  if(/^\/api\/projects\/[^/]+\/content$/.test(u.pathname)&&method==='GET'){
    const projectId=pathParam(u.pathname,'/api/projects/').replace(/\/content$/,'');const project=store.getProject(projectId,userId);if(!project)return sendJson(res,404,{ok:false,error:'project_not_found'});
    let content=store.getProjectContent(projectId,userId);
    if(!content){const template=getTemplate(String(u.searchParams.get('templateId')||''));const requestedKind=String(u.searchParams.get('kind')||template?.kind||'business');const safeKind=SITE_KITS[requestedKind]?requestedKind:'business';content=createDefaultSiteContent({kind:safeKind,templateId:template?.id||'',templateLabel:template?.label||'',request:template?.prompt||''});content.meta.managed=false;content=store.upsertProjectContent(projectId,userId,content);}
    return sendJson(res,200,{ok:true,content,schema:contentSchema(content.kit),summary:contentSummary(content)});
  }
  if(/^\/api\/projects\/[^/]+\/content$/.test(u.pathname)&&method==='PUT'){
    const projectId=pathParam(u.pathname,'/api/projects/').replace(/\/content$/,'');try{requireProjectRole(projectId,userId,'editor');}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message})}const body=await readJson(req,MAX_BODY);const requestedKind=String(body.kind||body.content?.kit||'business');const safeKind=SITE_KITS[requestedKind]?requestedKind:'business';let content=normalizeSiteContent(body.content||{},safeKind);content.meta={...(content.meta||{}),managed:true};content=store.upsertProjectContent(projectId,userId,content);store.createContentRevision(projectId,userId,content,'draft');syncProjectContent(projectId,userId,content);return sendJson(res,200,{ok:true,content,schema:contentSchema(content.kit),summary:contentSummary(content)});
  }
  if(/^\/api\/projects\/[^/]+\/content\/operations$/.test(u.pathname)&&method==='POST'){
    const projectId=pathParam(u.pathname,'/api/projects/').replace(/\/content\/operations$/,'');try{requireProjectRole(projectId,userId,'editor');}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message})}const body=await readJson(req,MAX_BODY);let content=store.getProjectContent(projectId,userId);if(!content){const requestedKind=String(body.kind||'business');const safeKind=SITE_KITS[requestedKind]?requestedKind:'business';content=createDefaultSiteContent({kind:safeKind});}
    try{content=applyContentOperation(content,body.operation||body,{kind:SITE_KITS[content.kit]?content.kit:'business'});content.meta={...(content.meta||{}),managed:true};content=store.upsertProjectContent(projectId,userId,content);store.createContentRevision(projectId,userId,content,'draft');syncProjectContent(projectId,userId,content);return sendJson(res,200,{ok:true,content,summary:contentSummary(content)});}catch(e){return sendJson(res,400,{ok:false,error:e.message});}
  }
  if(method==='POST'&&u.pathname==='/api/projects'){const b=await readJson(req,MAX_BODY),name=String(b.name||'').trim().slice(0,80);if(!name)return sendJson(res,400,{ok:false,error:'name_required'});const p=store.createProject(userId,{name});store.addAuditLog({actorUserId:userId,action:'project.created',resourceType:'project',resourceId:p.id,metadata:{name:p.name}});try{const repo=await ensureProjectRepository(p);const saved=store.updateProjectRepo(p.id,repo);return sendJson(res,201,{ok:true,project:{...saved,repo_path:undefined}})}catch(e){return sendJson(res,500,{ok:false,error:`project_repo_init_failed: ${e.message}`})}}
  if(/^\/api\/projects\/[^/]+\/memory$/.test(u.pathname)&&method==='GET'){const pid=pathParam(u.pathname,'/api/projects/').replace(/\/memory$/,'');try{requireProjectRole(pid,userId,'viewer');return sendJson(res,200,{ok:true,memory:store.getProjectMemory(pid,userId)||{}});}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message})}}
  if(/^\/api\/projects\/[^/]+\/memory$/.test(u.pathname)&&method==='PUT'){const pid=pathParam(u.pathname,'/api/projects/').replace(/\/memory$/,'');try{requireProjectRole(pid,userId,'editor');const b=await readJson(req,MAX_BODY),memory=b.memory&&typeof b.memory==='object'?b.memory:{};const saved=store.setProjectMemory(pid,userId,memory);store.addAuditLog({actorUserId:userId,action:'project.memory.updated',resourceType:'project',resourceId:pid,metadata:{keys:Object.keys(saved)}});return sendJson(res,200,{ok:true,memory:saved});}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message})}}
  if(method==='GET'&&u.pathname==='/api/feature-flags/evaluate'){try{const key=String(u.searchParams.get('key')||''),flag=store.getFeatureFlag(key);if(!flag)return sendJson(res,404,{ok:false,error:'feature_flag_not_found'});const projectId=u.searchParams.get('projectId')||'';if(projectId&&!store.getProject(projectId,userId))return sendJson(res,404,{ok:false,error:'project_not_found'});return sendJson(res,200,{ok:true,evaluation:evaluateFeatureFlag(flag,{userId,projectId,environment:process.env.NODE_ENV||'development'})});}catch(e){return sendJson(res,e.status||400,{ok:false,error:e.message})}}
  if(method==='GET'&&u.pathname.startsWith('/api/projects/')&&u.pathname.endsWith('/sessions')){const pid=pathParam(u.pathname,'/api/projects/').replace(/\/sessions$/,'');if(!store.getProject(pid,userId))return sendJson(res,404,{ok:false,error:'project_not_found'});return sendJson(res,200,{ok:true,sessions:store.listSessions(pid,userId)})}
  if(method==='POST'&&/^\/api\/projects\/[^/]+\/sessions$/.test(u.pathname)){const pid=pathParam(u.pathname,'/api/projects/').replace(/\/sessions$/,'');try{requireProjectRole(pid,userId,'editor');}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message})}const b=await readJson(req,MAX_BODY);try{return sendJson(res,201,{ok:true,session:store.createSession(userId,pid,String(b.title||'New build').slice(0,120))})}catch(e){return sendJson(res,404,{ok:false,error:e.message})}}
  if(method==='GET'&&u.pathname.startsWith('/api/sessions/')&&u.pathname.endsWith('/messages')){const sid=pathParam(u.pathname,'/api/sessions/').replace(/\/messages$/,'');return sendJson(res,200,{ok:true,messages:store.listMessages(sid,userId)})}
  if(method==='GET'&&u.pathname.startsWith('/api/sessions/')&&u.pathname.endsWith('/runs')){const sid=pathParam(u.pathname,'/api/sessions/').replace(/\/runs$/,'');return sendJson(res,200,{ok:true,runs:store.listRuns(sid,userId)})}
  if(method==='GET'&&u.pathname.startsWith('/api/runs/')&&u.pathname.endsWith('/inspect')){const id=pathParam(u.pathname,'/api/runs/').replace(/\/inspect$/,'');const run=store.getRun(id,userId);if(!run)return sendJson(res,404,{ok:false,error:'not_found'});return sendJson(res,200,{ok:true,...await inspectWorkspace(run.workspace)})}
  if(method==='GET'&&u.pathname.startsWith('/api/runs/')&&u.pathname.endsWith('/tasks')){const id=pathParam(u.pathname,'/api/runs/').replace(/\/tasks$/,'');if(!store.getRun(id,userId))return sendJson(res,404,{ok:false,error:'not_found'});return sendJson(res,200,{ok:true,tasks:store.listTasks(id)})}
  if(method==='GET'&&u.pathname.startsWith('/api/runs/')&&u.pathname.endsWith('/repository-index')){const id=pathParam(u.pathname,'/api/runs/').replace(/\/repository-index$/,'');if(!store.getRun(id,userId))return sendJson(res,404,{ok:false,error:'not_found'});return sendJson(res,200,{ok:true,index:store.getRepositoryIndex(id)})}
  if(method==='GET'&&u.pathname.startsWith('/api/runs/')&&u.pathname.endsWith('/usage')){const id=pathParam(u.pathname,'/api/runs/').replace(/\/usage$/,'');if(!store.getRun(id,userId))return sendJson(res,404,{ok:false,error:'not_found'});return sendJson(res,200,{ok:true,usage:store.listUsage(id,userId),summary:store.usageSummary(id,userId)})}
  if(method==='GET'&&u.pathname.startsWith('/api/runs/')&&u.pathname.endsWith('/diagnostics')){const id=pathParam(u.pathname,'/api/runs/').replace(/\/diagnostics$/,'');const run=store.getRun(id,userId);if(!run)return sendJson(res,404,{ok:false,error:'not_found'});const evidence=store.listEvidence(id),usage=store.usageSummary(id,userId),review=[...evidence].filter(x=>x.type==='review').at(-1)?.payload||null;let inspect=null;try{inspect=await inspectWorkspace(run.workspace);}catch{}return sendJson(res,200,{ok:true,diagnostics:buildDiagnostics({run,evidence,usage,review,inspect})});}
  if(method==='GET'&&u.pathname.startsWith('/api/runs/')&&u.pathname.endsWith('/goal')){const id=pathParam(u.pathname,'/api/runs/').replace(/\/goal$/,'');if(!store.getRun(id,userId))return sendJson(res,404,{ok:false,error:'not_found'});return sendJson(res,200,{ok:true,goal:store.getGoal(id)})}
  if(method==='PATCH'&&u.pathname.startsWith('/api/runs/')&&u.pathname.endsWith('/goal')){const id=pathParam(u.pathname,'/api/runs/').replace(/\/goal$/,'');const run=store.getRun(id,userId);if(!run)return sendJson(res,404,{ok:false,error:'not_found'});const session=store.getSession(run.session_id,userId);try{if(!session)throw Object.assign(new Error('session_not_found'),{status:404});requireProjectRole(session.project_id,userId,'editor');}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message})};const b=await readJson(req,MAX_BODY);return sendJson(res,200,{ok:true,goal:store.updateGoal(id,b)})}
  if(method==='GET'&&u.pathname.startsWith('/api/runs/')&&u.pathname.endsWith('/dependencies')){const id=pathParam(u.pathname,'/api/runs/').replace(/\/dependencies$/,'');if(!store.getRun(id,userId))return sendJson(res,404,{ok:false,error:'not_found'});return sendJson(res,200,{ok:true,dependencies:store.listDependencyRequests(id,userId)});}
  if(method==='POST'&&u.pathname.startsWith('/api/dependency-requests/')&&u.pathname.endsWith('/approve')){const id=pathParam(u.pathname,'/api/dependency-requests/').replace(/\/approve$/,'');const depReq=store.getDependencyRequest?.(id,userId);if(!depReq)return sendJson(res,404,{ok:false,error:'not_found'});try{const run=store.getRun(depReq.run_id,userId),session=run&&store.getSession(run.session_id,userId);if(!session)throw Object.assign(new Error('not_found'),{status:404});requireProjectRole(session.project_id,userId,'reviewer');}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message})}const b=await readJson(req,MAX_BODY);if(!b.confirmed)return sendJson(res,400,{ok:false,error:'explicit_confirmation_required'});try{const approved=store.approveDependencyRequest(id,userId);if(!approved)return sendJson(res,404,{ok:false,error:'not_found'});return sendJson(res,200,{ok:true,dependencyRequest:approved});}catch(e){return sendJson(res,404,{ok:false,error:e.message});}}
  if(method==='GET'&&u.pathname.startsWith('/api/runs/')&&u.pathname.endsWith('/checkpoints')){const id=pathParam(u.pathname,'/api/runs/').replace(/\/checkpoints$/,'');if(!store.getRun(id,userId))return sendJson(res,404,{ok:false,error:'not_found'});return sendJson(res,200,{ok:true,checkpoints:store.listCheckpoints(id).map(x=>({...x,path:undefined}))})}
  if(method==='POST'&&u.pathname.startsWith('/api/runs/')&&u.pathname.endsWith('/checkpoints')){const id=pathParam(u.pathname,'/api/runs/').replace(/\/checkpoints$/,'');const run=store.getRun(id,userId);if(!run)return sendJson(res,404,{ok:false,error:'not_found'});try{const session=store.getSession(run.session_id,userId);if(!session)throw Object.assign(new Error('session_not_found'),{status:404});requireProjectRole(session.project_id,userId,'editor');}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message})}const b=await readJson(req,MAX_BODY);const cp=createCheckpoint(run.workspace,path.resolve(process.env.CODINGVIBES_CHECKPOINT_ROOT||path.join(process.cwd(),'data','checkpoints')),String(b.name||'manual'));const saved=store.createCheckpoint(id,cp.name,cp.path,{manual:true});return sendJson(res,201,{ok:true,checkpoint:{...saved,path:undefined}})}
  if(/^\/api\/runs\/[^/]+\/checkpoints\/[^/]+\/restore$/.test(u.pathname)&&method==='POST'){const parts=u.pathname.split('/'),runId=parts[3],checkpointId=parts[5];const run=store.getRun(runId,userId);if(!run)return sendJson(res,404,{ok:false,error:'not_found'});try{const session=store.getSession(run.session_id,userId);if(!session)throw Object.assign(new Error('session_not_found'),{status:404});requireProjectRole(session.project_id,userId,'editor');}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message})}if(!run)return sendJson(res,404,{ok:false,error:'not_found'});const cp=store.getCheckpoint(checkpointId);if(!cp||cp.run_id!==runId)return sendJson(res,404,{ok:false,error:'checkpoint_not_found'});const b=await readJson(req,MAX_BODY);if(!b.confirmed)return sendJson(res,400,{ok:false,error:'explicit_confirmation_required'});const restored=restoreCheckpoint(run.workspace,cp.path);store.updateRun(runId,userId,{status:'edited'});store.addEvidence(runId,'checkpoint_restore',{checkpointId,checkpoint:cp.name});return sendJson(res,restored.ok?200:409,{ok:restored.ok,checkpointId})}
  if(method==='POST'&&u.pathname.startsWith('/api/runs/')&&u.pathname.endsWith('/cancel')){const id=pathParam(u.pathname,'/api/runs/').replace(/\/cancel$/,'');const run=store.getRun(id,userId);if(run){try{const session=store.getSession(run.session_id,userId);if(!session)throw Object.assign(new Error('session_not_found'),{status:404});requireProjectRole(session.project_id,userId,'editor');}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message})}}if(!run)return sendJson(res,404,{ok:false,error:'not_found'});if(!['running','planning','dependency_install','building','artifact_collection','device_smoke','verifying','repairing'].includes(run.status))return sendJson(res,409,{ok:false,error:'run_not_active'});const active=activeBuilds.get(userId);if(active?.runId===id)active.controller.abort();store.updateRun(id,userId,{status:'cancelled'});store.updateGoal(id,{status:'cancelled'});store.addEvidence(id,'cancel_requested',{at:new Date().toISOString(),interrupted:Boolean(active?.runId===id)});return sendJson(res,200,{ok:true,status:'cancelled',interrupted:Boolean(active?.runId===id)})}
  if(method==='POST'&&u.pathname.startsWith('/api/runs/')&&u.pathname.endsWith('/resume')){const id=pathParam(u.pathname,'/api/runs/').replace(/\/resume$/,'');const run=store.getRun(id,userId);if(run){try{const session=store.getSession(run.session_id,userId);if(!session)throw Object.assign(new Error('session_not_found'),{status:404});requireProjectRole(session.project_id,userId,'editor');}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message})}}if(!run)return sendJson(res,404,{ok:false,error:'not_found'});if(activeBuilds.has(userId))return sendJson(res,409,{ok:false,error:'build_already_running'});const b=await readJson(req,MAX_BODY);const cps=store.listCheckpoints(id);const cp=b.checkpointId?store.getCheckpoint(b.checkpointId):cps.at(-1);if(!cp)return sendJson(res,409,{ok:false,error:'no_checkpoint'});if(b.restore!==false){if(!b.confirmed)return sendJson(res,400,{ok:false,error:'explicit_confirmation_required'});restoreCheckpoint(run.workspace,cp.path);}store.updateRun(id,userId,{status:'running'});store.addEvidence(id,'resumed',{checkpointId:cp.id});const result=await verifyExistingRun({run:{...run,status:'running'},userId,store,router:userRouter(userId),onEvent:e=>{}});return sendJson(res,result.passed?200:422,{ok:result.passed,status:result.passed?'verified':'failed',checkpointId:cp.id,result});}
  if(method==='GET'&&u.pathname.startsWith('/api/runs/')&&u.pathname.endsWith('/evidence')){const id=pathParam(u.pathname,'/api/runs/').replace(/\/evidence$/,'');if(!store.getRun(id,userId))return sendJson(res,404,{ok:false,error:'not_found'});return sendJson(res,200,{ok:true,evidence:store.listEvidence(id)})}
  if(method==='GET'&&u.pathname.startsWith('/api/runs/')&&u.pathname.endsWith('/events')){const id=pathParam(u.pathname,'/api/runs/').replace(/\/events$/,'');if(!store.getRun(id,userId))return sendJson(res,404,{ok:false,error:'not_found'});return sendJson(res,200,{ok:true,events:store.listEvents(id,userId)})}
  if(method==='GET'&&u.pathname.startsWith('/api/runs/')&&u.pathname.endsWith('/changesets')){const id=pathParam(u.pathname,'/api/runs/').replace(/\/changesets$/,'');if(!store.getRun(id,userId))return sendJson(res,404,{ok:false,error:'not_found'});return sendJson(res,200,{ok:true,changesets:store.listChangesets(id)})}
  if(method==='GET'&&u.pathname.startsWith('/api/runs/')&&u.pathname.endsWith('/files')){const id=pathParam(u.pathname,'/api/runs/').replace(/\/files$/,'');const run=store.getRun(id,userId);if(!run)return sendJson(res,404,{ok:false,error:'not_found'});return sendJson(res,200,{ok:true,files:listFiles(run.workspace)})}
  if(method==='GET'&&u.pathname.startsWith('/api/runs/')&&u.pathname.endsWith('/artifacts')){const id=pathParam(u.pathname,'/api/runs/').replace(/\/artifacts$/,'');if(!store.getRun(id,userId))return sendJson(res,404,{ok:false,error:'not_found'});return sendJson(res,200,{ok:true,artifacts:store.listArtifacts(id).map(a=>({...a,stored_path:undefined}))})}
  if(method==='GET'&&/^\/api\/runs\/[^/]+\/artifacts\/[^/]+$/.test(u.pathname)){const parts=u.pathname.split('/');const runId=parts[3],artifactId=parts[5];if(!store.getRun(runId,userId))return sendJson(res,404,{ok:false,error:'not_found'});const artifact=store.getArtifact(artifactId);if(!artifact||artifact.run_id!==runId||!artifact.stored_path)return sendJson(res,404,{ok:false,error:'artifact_not_downloadable'});const root=path.resolve(process.env.CODINGVIBES_ARTIFACT_ROOT||path.join(process.cwd(),'data','artifacts'));const target=path.resolve(artifact.stored_path);if(!(target===root||target.startsWith(root+path.sep))||!fs.existsSync(target))return sendJson(res,404,{ok:false,error:'artifact_not_found'});const stat=fs.statSync(target);if(stat.size!==Number(artifact.size))return sendJson(res,409,{ok:false,error:'artifact_size_changed'});const sha=createHash('sha256').update(fs.readFileSync(target)).digest('hex');if(sha!==artifact.sha256)return sendJson(res,409,{ok:false,error:'artifact_checksum_changed'});res.writeHead(200,{'content-type':'application/octet-stream','content-length':String(stat.size),'content-disposition':`attachment; filename=\"${path.basename(target).replace(/[^a-zA-Z0-9._-]/g,'_')}\"`,'x-artifact-sha256':sha,'cache-control':'private, no-store'});fs.createReadStream(target).pipe(res);return; }
  if(method==='GET'&&u.pathname.startsWith('/api/runs/')&&u.searchParams.has('file')){const id=pathParam(u.pathname,'/api/runs/');const run=store.getRun(id,userId);if(!run)return sendJson(res,404,{ok:false,error:'not_found'});const file=u.searchParams.get('file');const target=resolveInside(run.workspace,file);return sendJson(res,200,{ok:true,path:file,content:fs.readFileSync(target,'utf8')})}
  if(method==='GET'&&u.pathname.startsWith('/api/runs/')){const id=pathParam(u.pathname,'/api/runs/');const run=store.getRun(id,userId);if(!run)return sendJson(res,404,{ok:false,error:'not_found'});return sendJson(res,200,{ok:true,run,evidence:store.listEvidence(id),changesets:store.listChangesets(id),events:store.listEvents(id,userId)})}
  if(method==='POST'&&u.pathname==='/api/media/video'){
    let body;try{body=normalizeVideoRequest(await readJson(req,MAX_BODY));}catch(e){return sendJson(res,e.status||400,{ok:false,error:e.message});}
    const billing=store.getBilling(userId),plan=getPlan(billing.plan);
    const normalFreeTrial=plan.id==='free'&&Number(plan.videoTrialSeconds||0)>0;
    if(!hasFeature(plan.id,'ai_video')&&!normalFreeTrial)return sendJson(res,402,{ok:false,error:'feature_requires_plan',feature:'ai_video',requiredPlan:'pro',plan:plan.id});
    if(plan.id==='free'&&!normalFreeTrial)return sendJson(res,402,{ok:false,error:'video_trial_used',feature:'ai_video',requiredPlan:'pro'});
    if(plan.id==='free'&&body.duration>Number(plan.videoTrialSeconds||5))return sendJson(res,400,{ok:false,error:'video_trial_duration_exceeded',maxSeconds:Number(plan.videoTrialSeconds||5)});
    if(plan.id!=='free'){const used=store.monthlyVideoSeconds(userId,currentPeriodKey());if(used+body.duration>Number(plan.videoSeconds||0))return sendJson(res,402,{ok:false,error:'video_quota_reached',feature:'ai_video',plan:plan.id,usedSeconds:used,remainingSeconds:Math.max(0,Number(plan.videoSeconds||0)-used),monthlySeconds:Number(plan.videoSeconds||0)});}
    const runwayKey=process.env.RUNWAYML_API_SECRET||process.env.RUNWAY_API_KEY;if(!runwayKey)return sendJson(res,503,{ok:false,error:'video_provider_not_configured'});
    if(plan.id==='free'&&!store.consumeVideoTrial(userId))return sendJson(res,402,{ok:false,error:'video_trial_used',feature:'ai_video',requiredPlan:'pro'});
    let task;let job;
    try{
      job=store.createMediaJob(userId,{prompt:body.prompt,model:body.model,ratio:body.ratio,duration:body.duration});
      task=await createVideoTask(body);
      const saved=store.updateMediaJob(job.id,userId,{status:'running',runway_task_id:task.taskId});
      return sendJson(res,202,{ok:true,job:{id:saved.id,status:saved.status,taskId:saved.runway_task_id,prompt:saved.prompt,duration:saved.duration,ratio:saved.ratio,model:saved.model}});
    }catch(e){
      if(job)store.updateMediaJob(job.id,userId,{status:'failed',error:e.message});
      return sendJson(res,e.status||503,{ok:false,error:e.message,jobId:job?.id||null});
    }
  }
  if(/^\/api\/media\/video\/[^/]+$/.test(u.pathname)&&method==='GET'){
    const id=pathParam(u.pathname,'/api/media/video/');const job=store.getMediaJob(id,userId);if(!job)return sendJson(res,404,{ok:false,error:'media_job_not_found'});
    if(job.status==='running'&&job.runway_task_id){
      try{
        const task=await getVideoTask(job.runway_task_id);
        if(task.status==='SUCCEEDED'&&task.url&&!job.stored_path){
          const root=path.resolve(process.env.CODINGVIBES_MEDIA_ROOT||path.join(process.cwd(),'data','media'));
          const target=path.join(root,String(userId),`${job.id}.mp4`);
          const saved=await downloadVideo(task.url,target);
          const next=store.updateMediaJob(id,userId,{status:'succeeded',source_url:task.url,stored_path:target,size:saved.size});
          return sendJson(res,200,{ok:true,job:{...next,stored_path:undefined},url:`/api/media/video/${id}/file`});
        }
        if(['FAILED','CANCELLED'].includes(task.status)){const next=store.updateMediaJob(id,userId,{status:'failed',error:String(task.error||`${task.status.toLowerCase()}`)});return sendJson(res,200,{ok:true,job:{...next,stored_path:undefined}});}
        return sendJson(res,200,{ok:true,job:{...job,stored_path:undefined},status:task.status});
      }catch(e){return sendJson(res,200,{ok:true,job:{...job,stored_path:undefined},status:'running',pollError:e.message});}
    }
    return sendJson(res,200,{ok:true,job:{...job,stored_path:undefined},url:job.status==='succeeded'?`/api/media/video/${id}/file`:null});
  }
  if(/^\/api\/media\/video\/[^/]+\/file$/.test(u.pathname)&&method==='GET'){
    const id=pathParam(u.pathname,'/api/media/video/').replace(/\/file$/,'');const job=store.getMediaJob(id,userId);if(!job?.stored_path)return sendJson(res,404,{ok:false,error:'video_not_ready'});
    const root=path.resolve(process.env.CODINGVIBES_MEDIA_ROOT||path.join(process.cwd(),'data','media')),target=path.resolve(job.stored_path);if(!(target===root||target.startsWith(root+path.sep))||!fs.existsSync(target))return sendJson(res,404,{ok:false,error:'video_file_not_found'});
    const stat=fs.statSync(target);res.writeHead(200,{'content-type':'video/mp4','content-length':String(stat.size),'cache-control':'private, max-age=3600'});fs.createReadStream(target).pipe(res);return;
  }
  if(method==='POST'&&u.pathname==='/api/agent/stream'){
    const b=await readJson(req,MAX_BODY),request=String(b.request||'').trim();if(!request)return sendJson(res,400,{ok:false,error:'request_required'});if(request.length>20000)return sendJson(res,413,{ok:false,error:'request_too_large'});const template=getTemplate(String(b.templateId||''));if(b.templateId&&!template)return sendJson(res,400,{ok:false,error:'template_not_found'});const effectiveRequest=template?`TEMPLATE BLUEPRINT: ${JSON.stringify({id:template.id,label:template.label,kind:template.kind,experience:template.experience,tier:template.tier,style:template.style,tags:template.tags,features:template.features,prompt:template.prompt})}\n\nCUSTOM USER REQUIREMENTS:\n${request}`:request;const billingForFeature=store.getBilling(userId),gate=featureGate(billingForFeature.plan,effectiveRequest);if(!gate.ok)return sendJson(res,402,{ok:false,error:'feature_requires_plan',feature:gate.blocked[0],requiredPlan:gate.requiredPlans[0]?.minPlan||'pro',plan:billingForFeature.plan,blocked:gate.blocked,requiredPlans:gate.requiredPlans});if(process.env.CODINGVIBES_ENFORCE_QUOTAS==='true'||(process.env.CODINGVIBES_ENFORCE_QUOTAS!=='false'&&process.env.NODE_ENV==='production')){const billing=store.getBilling(userId),usage=store.monthlyUsage(userId,currentPeriodKey()),quota=canStartRun({plan:billing.plan,runs:usage.runs,tokens:usage.tokens});if(!quota.ok)return sendJson(res,402,{ok:false,error:'usage_limit_reached',billing:{plan:billing.plan,usage,quota}});}let project;try{project=requireProjectRole(String(b.projectId||''),userId,'editor').project;}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message})}if(activeBuilds.has(userId))return sendJson(res,409,{ok:false,error:'build_already_running'});const session=b.sessionId?store.getSession(b.sessionId,userId):store.createSession(userId,project.id,String(b.title||'New build').slice(0,120));if(!session)return sendJson(res,404,{ok:false,error:'session_not_found'});const controller=new AbortController();activeBuilds.set(userId,{runId:null,controller});const baseEmit=streamSse(res);const emit=e=>{if(e?.type==='run_created'){const active=activeBuilds.get(userId);if(active)active.runId=e.runId;}baseEmit(e)};try{await executeBuild({request:effectiveRequest,userId,sessionId:session.id,project,store,router:userRouter(userId),onEvent:emit,commit:false,targetId:normalizeTargetId(b.target),signal:controller.signal});res.end();}catch(e){emit({type:'error',error:e.message});res.end();}finally{activeBuilds.delete(userId)}return;
  }
  if(method==='POST'&&u.pathname.startsWith('/api/changesets/')&&u.pathname.endsWith('/commit')){const id=pathParam(u.pathname,'/api/changesets/').replace(/\/commit$/,'');const cs=store.getChangeset(id);if(!cs)return sendJson(res,404,{ok:false,error:'not_found'});const run=store.getRun(cs.run_id,userId);if(!run)return sendJson(res,404,{ok:false,error:'not_found'});try{const session=store.getSession(run.session_id,userId);if(!session)throw Object.assign(new Error('session_not_found'),{status:404});requireProjectRole(session.project_id,userId,'editor');}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message})}if(!run)return sendJson(res,404,{ok:false,error:'not_found'});if(cs.status!=='verified')return sendJson(res,409,{ok:false,error:'changeset_must_be_verified'});const b=await readJson(req,MAX_BODY);if(!b.confirmed)return sendJson(res,400,{ok:false,error:'explicit_confirmation_required'});const c=await commitWorkspace(run.workspace,cs.summary||'codingVibes changeset');if(!c.ok)return sendJson(res,409,{ok:false,error:c.stderr});const sha=(c.stdout.match(/\[[^ ]+ ([0-9a-f]+)\]/)||[])[1]||null;store.updateChangeset(id,{status:'committed',commit_sha:sha});return sendJson(res,200,{ok:true,commitSha:sha,stdout:c.stdout})}
  if(method==='POST'&&/^\/api\/runs\/[^/]+\/assets$/.test(u.pathname)){
    const id=pathParam(u.pathname,'/api/runs/').replace(/\/assets$/,'');
    const run=store.getRun(id,userId);
    if(!run)return sendJson(res,404,{ok:false,error:'not_found'});
    try{const session=store.getSession(run.session_id,userId);if(!session)throw Object.assign(new Error('session_not_found'),{status:404});requireProjectRole(session.project_id,userId,'editor');}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message});}
    let body;try{body=await readJson(req,MAX_ASSET_UPLOAD_BODY);}catch(e){return sendJson(res,e.status||400,{ok:false,error:e.message});}
    const encoded=String(body.contentBase64||'');
    if(!encoded||encoded.length%4!==0||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded))return sendJson(res,400,{ok:false,error:'invalid_image_encoding'});
    const bytes=Buffer.from(encoded,'base64');
    if(!bytes.length||bytes.length>MAX_ASSET_UPLOAD_BYTES||bytes.toString('base64')!==encoded)return sendJson(res,413,{ok:false,error:'image_size_or_encoding_invalid'});
    const fileName=path.basename(String(body.fileName||'optimized-image.webp')).normalize('NFKC').replace(/[^a-zA-Z0-9._-]/g,'-').slice(0,100);
    if(!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,95}\.(?:webp|png|jpe?g)$/i.test(fileName))return sendJson(res,400,{ok:false,error:'unsupported_image_filename'});
    const ext=path.extname(fileName).toLowerCase();
    const expectedMime={'.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg'}[ext];
    const actualMime=bytes.length>=12&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'?'image/webp':bytes.length>=8&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'image/png':bytes.length>=3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff?'image/jpeg':null;
    if(!expectedMime||body.mimeType!==expectedMime||actualMime!==expectedMime)return sendJson(res,415,{ok:false,error:'image_type_mismatch'});
    const digest=createHash('sha256').update(bytes).digest('hex');
    const stem=path.basename(fileName,ext).replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,55)||'optimized-image';
    const safeName=stem+'-'+digest.slice(0,12)+ext;
    const assetPath='public/assets/'+safeName;
    let target;try{target=resolveInside(run.workspace,assetPath,{forWrite:true});}catch(e){return sendJson(res,400,{ok:false,error:e.message});}
    fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);
    store.updateRun(id,userId,{status:'edited'});
    const existing=store.listChangesets(id).filter(item=>item.status!=='committed').at(-1);
    if(existing)store.updateChangeset(existing.id,{status:'needs_verification'});
    else store.createChangeset(id,{status:'needs_verification',summary:'Optimized image asset',operations:[{type:'write',path:assetPath}]});
    store.addEvidence(id,'optimized_image',{path:assetPath,mimeType:expectedMime,sizeBytes:bytes.length,sha256:digest});
    return sendJson(res,201,{ok:true,path:assetPath,url:'/assets/'+safeName,mimeType:expectedMime,sizeBytes:bytes.length,sha256:digest,verificationRequired:true});
  }
  if(method==='PUT'&&/^\/api\/runs\/[^/]+\/files$/.test(u.pathname)){const id=pathParam(u.pathname,'/api/runs/').replace(/\/files$/,'');const run=store.getRun(id,userId);if(!run)return sendJson(res,404,{ok:false,error:'not_found'});try{const session=store.getSession(run.session_id,userId);if(!session)throw Object.assign(new Error('session_not_found'),{status:404});requireProjectRole(session.project_id,userId,'editor');}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message})}if(!run)return sendJson(res,404,{ok:false,error:'not_found'});const b=await readJson(req,MAX_BODY);if(typeof b.path!=='string')return sendJson(res,400,{ok:false,error:'path_required'});const target=resolveInside(run.workspace,b.path,{forWrite:true});fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,String(b.content??''),'utf8');store.updateRun(id,userId,{status:'edited'});const existing=store.listChangesets(id).filter(x=>x.status!=='committed').at(-1);if(existing)store.updateChangeset(existing.id,{status:'needs_verification'});else store.createChangeset(id,{status:'needs_verification',summary:'User edits',operations:[{type:'write',path:b.path}]});store.addEvidence(id,'user_edit',{path:b.path});return sendJson(res,200,{ok:true,path:b.path})}
  if(method==='POST'&&u.pathname.startsWith('/api/runs/')&&u.pathname.endsWith('/verify')){const id=pathParam(u.pathname,'/api/runs/').replace(/\/verify$/,'');const run=store.getRun(id,userId);if(!run)return sendJson(res,404,{ok:false,error:'not_found'});try{const session=store.getSession(run.session_id,userId);if(!session)throw Object.assign(new Error('session_not_found'),{status:404});requireProjectRole(session.project_id,userId,'editor');}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message})}if(!run)return sendJson(res,404,{ok:false,error:'not_found'});const result=await verifyExistingRun({run,userId,store,router:userRouter(userId),onEvent:e=>{}});return sendJson(res,result.passed?200:422,{ok:result.passed,result})}
  if(method==='POST'&&u.pathname.startsWith('/api/runs/')&&u.pathname.endsWith('/revert')){const id=pathParam(u.pathname,'/api/runs/').replace(/\/revert$/,'');const run=store.getRun(id,userId);if(!run)return sendJson(res,404,{ok:false,error:'not_found'});try{const session=store.getSession(run.session_id,userId);if(!session)throw Object.assign(new Error('session_not_found'),{status:404});requireProjectRole(session.project_id,userId,'editor');}catch(e){return sendJson(res,e.status||403,{ok:false,error:e.message})}if(!run)return sendJson(res,404,{ok:false,error:'not_found'});const b=await readJson(req,MAX_BODY);if(!b.confirmed)return sendJson(res,400,{ok:false,error:'explicit_confirmation_required'});const c=await revertWorkspace(run.workspace,b.ref||'HEAD');store.addEvidence(id,'git_revert',{ref:b.ref||'HEAD',ok:c.ok,stdout:c.stdout,stderr:c.stderr});return sendJson(res,c.ok?200:409,{ok:c.ok,stdout:c.stdout,stderr:c.stderr})}
  if(await serveStatic(req,res))return;return sendJson(res,404,{ok:false,error:'not_found'});
 }catch(e){return sendJson(res,e.status||500,{ok:false,error:e.message})}
});}

function latestVerifiedWorkspace(projectId,userId){
  const sessions=store.listSessions(projectId,userId);
  for(const session of sessions)for(const run of store.listRuns(session.id,userId)){
    if(run.status==='verified'&&run.workspace&&fs.existsSync(run.workspace))return {workspace:run.workspace,run};
  }
  return null;
}
function syncDeploymentContent(projectId,userId,workspace){
  const project=store.getProject(projectId,userId);if(!project||!workspace)return;
  const content=store.getProjectContent(projectId,userId);if(content)writeProjectContentFile({...project,repo_path:workspace},content);
  const src=path.join(project.repo_path||'','public','assets'),dst=path.join(workspace,'public','assets');
  if(fs.existsSync(src)){fs.rmSync(dst,{recursive:true,force:true});fs.cpSync(src,dst,{recursive:true})}
}

export const server=createAppServer();
if(process.argv[1]===fileURLToPath(import.meta.url)){server.listen(PORT,HOST,()=>console.log(`Build Vibe listening on http://${HOST}:${PORT}`));const shutdown=()=>{try{store.close()}finally{server.close(()=>process.exit(0))}};process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);}
