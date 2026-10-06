import {getTarget} from '../targets/registry.js';
import {targetExecutionAvailability} from '../targets/verify.js';
import {getProvider} from './providers.js';
import {compatibility} from './compatibility.js';

const PROVIDER_REQUIREMENTS={
  github:[['GITHUB_TOKEN','github_access_token_missing']],
  vercel:[['VERCEL_TOKEN','vercel_token_missing']],
  netlify:[['NETLIFY_AUTH_TOKEN','netlify_token_missing']],
  cloudflare:[['CLOUDFLARE_API_TOKEN','cloudflare_api_token_missing'],['CLOUDFLARE_ACCOUNT_ID','cloudflare_account_id_missing']],
  hostinger:[['GITHUB_TOKEN','github_access_token_missing']],
  'coding-vibes':[['CODINGVIBES_HOSTING_API_URL','coding_vibes_hosting_url_missing']]
};

export function assessDeploymentPreflight({provider='',targetId='web-node',env=process.env,workspace=null}={}){
  const requested=String(provider||'').trim().toLowerCase();
  const target=getTarget(targetId)||getTarget('web-node');
  if(!requested)return{status:'NOT_CONFIGURED',provider:null,targetId:target.id,blockers:[],warnings:['deployment_provider_not_selected']};
  const adapter=getProvider(requested);
  if(!adapter)return{status:'BLOCKED',provider:requested,targetId:target.id,blockers:['unsupported_deployment_provider'],warnings:[]};
  const blockers=[],warnings=[];
  for(const [key,error] of (PROVIDER_REQUIREMENTS[requested]||[]))if(!env[key])blockers.push(error);
  const availability=targetExecutionAvailability(target,env);
  if(target.native&&!availability.canBuild)blockers.push('target_execution_unavailable:'+target.id+(availability.host.missing?.length?':'+availability.host.missing.join(','):'')); 
  const artifact={deploymentMetadata:{serverRequired:!['web-node','web-pwa','desktop-electron'].includes(target.id),missingFiles:[]}};
  const cap=compatibility(requested,artifact);
  if(!cap.compatible&&requested!=='manual')blockers.push('provider_target_incompatible');
  if(requested==='manual')warnings.push('manual_export_does_not_publish_to_a_managed_provider');
  const status=blockers.length?'BLOCKED':'PASS';
  return{status,provider:requested,targetId:target.id,providerLabel:adapter.label,blockers,warnings,targetAvailability:availability,compatibility:cap};
}
