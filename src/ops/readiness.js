import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {getPlan} from '../billing/plans.js';
export function readiness({router}={}) {
  const production=process.env.NODE_ENV==='production';
  const blockers=[],warnings=[];
  if(production && String(process.env.CODINGVIBES_SESSION_SECRET||'').length<32) blockers.push('session_secret_too_short');
  const runtime=process.env.CODINGVIBES_RUNTIME||(production?'daytona':'local');
  if(production && runtime==='local' && process.env.CODINGVIBES_ALLOW_HOST_EXECUTION!=='true') warnings.push('local_runtime_selected_but_host_execution_is_disabled');
  if(production && runtime==='daytona' && !process.env.DAYTONA_API_KEY) blockers.push('daytona_api_key_missing');
  if(production && runtime==='container' && !process.env.CODINGVIBES_CONTAINER_IMAGE) warnings.push('container_image_defaulted');
  if(production && process.env.CODINGVIBES_ENFORCE_QUOTAS!=='true') blockers.push('quota_enforcement_not_enabled');
  const db=process.env.DATABASE_PATH||'./data/codingvibes.db';try{fs.accessSync(requireDir(db),fs.constants.R_OK|fs.constants.W_OK);}catch{blockers.push('database_directory_not_writable');}
  const git=spawnSync('git',['--version'],{stdio:'ignore'});if(git.status!==0)blockers.push('git_missing');
  const model=router?.getStatus?.()||{};if(production&&!model.configured)blockers.push('model_provider_not_configured');
  if(production && process.env.CODINGVIBES_ENABLE_BROWSER!=='true')warnings.push('browser_verification_disabled');
  if(!process.env.STRIPE_SECRET_KEY||!process.env.STRIPE_WEBHOOK_SECRET)warnings.push('stripe_billing_not_configured');
  if(!process.env.CODINGVIBES_DEPENDENCY_NETWORK)warnings.push('dependency_network_not_configured');
  if(!process.env.GITHUB_TOKEN)warnings.push('server_github_token_not_configured');
  return {ready:blockers.length===0,environment:production?'production':'development',runtime,blockers,warnings,model:{configured:Boolean(model.configured),provider:model.provider||null},timestamp:new Date().toISOString(),quotaPlan:getPlan('free').id};
}
function requireDir(file){return file.includes('/')?file.slice(0,file.lastIndexOf('/'))||'.':'.';}
