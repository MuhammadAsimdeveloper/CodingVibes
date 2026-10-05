import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {getPlan} from '../billing/plans.js';
import {scaleOutConfig} from '../platform/scaleout.js';
export function readiness({router,store}={}) {
  const production=process.env.NODE_ENV==='production';
  const blockers=[],warnings=[];
  if(production && String(process.env.CODINGVIBES_SESSION_SECRET||'').length<32) blockers.push('session_secret_too_short');
  const runtime=process.env.CODINGVIBES_RUNTIME||(production?'daytona':'local');
  if(production && !['daytona','container'].includes(runtime)) blockers.push('unsupported_production_runtime');
  if(production && runtime==='local') blockers.push('host_execution_forbidden_in_production');
  if(production && runtime==='daytona' && !process.env.DAYTONA_API_KEY) blockers.push('daytona_api_key_missing');
  if(production && runtime==='container' && !process.env.CODINGVIBES_CONTAINER_IMAGE) blockers.push('container_image_required');
  if(production && process.env.CODINGVIBES_ENFORCE_QUOTAS!=='true') blockers.push('quota_enforcement_not_enabled');
  const db=process.env.DATABASE_PATH||'./data/codingvibes.db';try{fs.accessSync(requireDir(db),fs.constants.R_OK|fs.constants.W_OK);}catch{blockers.push('database_directory_not_writable');}
  if(store?.healthcheck && !store.healthcheck()) blockers.push('database_healthcheck_failed');
  const git=spawnSync('git',['--version'],{stdio:'ignore'});if(git.status!==0)blockers.push('git_missing');
  const model=router?.getStatus?.()||{};if(production&&!model.configured)blockers.push('model_provider_not_configured');
  if(production && process.env.CODINGVIBES_ENABLE_BROWSER!=='true')blockers.push('browser_verification_required');
  if(production){
    const publicUrl=String(process.env.CODINGVIBES_PUBLIC_URL||'').trim();
    if(!publicUrl)blockers.push('public_url_missing');
    else {try{const parsed=new URL(publicUrl);if(parsed.protocol!=='https:')blockers.push('public_url_must_use_https')}catch{blockers.push('public_url_invalid')}}
    for(const dirKey of ['CODINGVIBES_PROJECT_ROOT','CODINGVIBES_WORK_ROOT','CODINGVIBES_CHECKPOINT_ROOT']){
      const dir=process.env[dirKey]||'';if(!dir){blockers.push(dirKey.toLowerCase()+'_missing');continue;}
      try{fs.mkdirSync(dir,{recursive:true});fs.accessSync(dir,fs.constants.R_OK|fs.constants.W_OK);}catch{blockers.push(dirKey.toLowerCase()+'_not_writable')}
    }
    const billingRequired=String(process.env.CODINGVIBES_BILLING_REQUIRED??'true')==='true';
    if(billingRequired){
      if(!process.env.STRIPE_SECRET_KEY)blockers.push('stripe_secret_missing');
      if(!process.env.STRIPE_WEBHOOK_SECRET)blockers.push('stripe_webhook_secret_missing');
      if(!process.env.STRIPE_PRICE_PRO_MONTHLY)blockers.push('stripe_pro_price_missing');
      if(!process.env.STRIPE_PRICE_TEAM_MONTHLY)blockers.push('stripe_team_price_missing');
    }
  } else if(!process.env.STRIPE_SECRET_KEY||!process.env.STRIPE_WEBHOOK_SECRET)warnings.push('stripe_billing_not_configured');
  if(!process.env.CODINGVIBES_DEPENDENCY_NETWORK)warnings.push('dependency_network_not_configured');
  const admins=String(process.env.CODINGVIBES_SUPERADMIN_EMAILS||'').split(',').map(x=>x.trim()).filter(Boolean);
  if(production&&admins.length===0)blockers.push('superadmin_allowlist_missing');
  const backupRoot=process.env.CODINGVIBES_BACKUP_ROOT||'./data/backups';
  try{fs.mkdirSync(backupRoot,{recursive:true});fs.accessSync(backupRoot,fs.constants.R_OK|fs.constants.W_OK);}catch{if(production)blockers.push('backup_directory_not_writable');else warnings.push('backup_directory_not_writable');}
  const scaleout=scaleOutConfig();
  if(production&&String(process.env.CODINGVIBES_SCALEOUT_REQUIRED||'false')==='true'&&!scaleout.ready)blockers.push(...scaleout.blockers.map(x=>'scaleout_'+x));
  else if(!scaleout.ready)warnings.push(...scaleout.blockers.map(x=>'scaleout_'+x));
  if(!process.env.GITHUB_TOKEN)warnings.push('server_github_token_not_configured');
  if(!process.env.GOOGLE_CLIENT_ID||!process.env.GOOGLE_CLIENT_SECRET||!process.env.GOOGLE_REDIRECT_URI)warnings.push('google_oauth_not_configured');
  return {ready:blockers.length===0,environment:production?'production':'development',runtime,blockers,warnings,model:{configured:Boolean(model.configured),provider:model.provider||null},timestamp:new Date().toISOString(),quotaPlan:getPlan('free').id};
}
function requireDir(file){return file.includes('/')?file.slice(0,file.lastIndexOf('/'))||'.':'.';}
