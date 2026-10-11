const SCHEMA='build-vibe.deployment-credential-check.v1';
const PROVIDER_CONFIG={
  github:{variables:['GITHUB_TOKEN'],endpoint:'https://api.github.com/user',identity:body=>Boolean(body?.login),headers:{'X-GitHub-Api-Version':'2026-03-10','Accept':'application/vnd.github+json'}},
  hostinger:{variables:['GITHUB_TOKEN'],endpoint:'https://api.github.com/user',identity:body=>Boolean(body?.login),headers:{'X-GitHub-Api-Version':'2026-03-10','Accept':'application/vnd.github+json'}},
  vercel:{variables:['VERCEL_TOKEN'],endpoint:'https://api.vercel.com/v2/user',identity:body=>Boolean(body?.user?.id||body?.user?.username||body?.id),headers:{Accept:'application/json'}},
  netlify:{variables:['NETLIFY_AUTH_TOKEN'],endpoint:'https://api.netlify.com/api/v1/user',identity:body=>Boolean(body?.id||body?.email),headers:{Accept:'application/json'}},
  cloudflare:{variables:['CLOUDFLARE_API_TOKEN','CLOUDFLARE_ACCOUNT_ID'],endpoint:'https://api.cloudflare.com/client/v4/user/tokens/verify',headers:{Accept:'application/json'}}
};

function result(provider,status,{credentialVariables=[],checks=[],blockers=[],warnings=[],writeAccessVerified=false}={}){
  return {schema:SCHEMA,provider,status,checkedAt:new Date().toISOString(),credentialVariables,checks,blockers,warnings,writeAccessVerified};
}
function missing(values){
  return values.filter(([key,value])=>!String(value??'').trim()).map(([key])=>key);
}
function classifyResponse(name,response,payload,identity){
  if(response.status===401||response.status===403)return {name,status:'BLOCKED',httpStatus:response.status,reason:'credential_rejected_or_permissions_insufficient'};
  if(response.status===429||response.status>=500)return {name,status:'UNVERIFIED',httpStatus:response.status,reason:'provider_service_unavailable'};
  if(!response.ok)return {name,status:'BLOCKED',httpStatus:response.status,reason:'credential_probe_http_error'};
  if(!payload||typeof payload!=='object')return {name,status:'UNVERIFIED',httpStatus:response.status,reason:'invalid_provider_response'};
  if(identity&&!identity(payload))return {name,status:'UNVERIFIED',httpStatus:response.status,reason:'expected_identity_not_returned'};
  return {name,status:'PASS',httpStatus:response.status,reason:'authenticated_identity_confirmed'};
}
async function requestJson(fetchImpl,url,token,headers={},timeoutMs=8000){
  const response=await fetchImpl(url,{method:'GET',headers:{authorization:'Bearer '+token,...headers},signal:AbortSignal.timeout(timeoutMs)});
  const payload=await response.json().catch(()=>null);
  return {response,payload};
}
function finalStatus(checks){
  if(checks.some(check=>check.status==='BLOCKED'))return 'BLOCKED';
  if(checks.some(check=>check.status==='UNVERIFIED'))return 'UNVERIFIED';
  return 'PASS';
}

/**
 * Performs non-mutating authentication probes for configured deployment providers.
 * It never logs or returns credentials and deliberately does not claim write access
 * unless a provider offers a safe read-only proof (none of these probes does).
 */
export async function verifyDeploymentCredential(provider,{env=process.env,fetchImpl=globalThis.fetch,timeoutMs=8000}={}){
  const requested=String(provider||'').trim().toLowerCase();
  if(!requested)return result(null,'NOT_CONFIGURED',{blockers:['deployment_provider_not_selected']});
  if(requested==='manual')return result(requested,'NOT_REQUIRED',{warnings:['manual_export_requires_no_provider_credentials']});
  const config=PROVIDER_CONFIG[requested];
  if(requested==='coding-vibes'){
    const base=String(env.CODINGVIBES_HOSTING_API_URL||env.CODINGVIBES_CLOUD_API_URL||'').trim().replace(/\/$/,'');
    const variables=['CODINGVIBES_HOSTING_API_URL'];
    if(!base)return result(requested,'NOT_CONFIGURED',{credentialVariables:variables,blockers:['hosting_endpoint_not_configured']});
    let parsed;
    try{parsed=new URL(base);}catch{return result(requested,'BLOCKED',{credentialVariables:variables,blockers:['hosting_endpoint_invalid']});}
    if(!['https:','http:'].includes(parsed.protocol)||parsed.username||parsed.password)return result(requested,'BLOCKED',{credentialVariables:variables,blockers:['hosting_endpoint_invalid']});
    return result(requested,'UNVERIFIED',{
      credentialVariables:variables,
      checks:[{name:'endpoint_configuration',status:'PASS',reason:'endpoint_url_validated'}],
      warnings:['hosting_adapter_has_no_documented_non_mutating_credential_probe','publish_permission_not_verified']
    });
  }
  if(!config)return result(requested,'BLOCKED',{blockers:['unsupported_deployment_provider']});
  const values=config.variables.map(key=>[key,env[key]]);
  const absent=missing(values);
  if(absent.length)return result(requested,'NOT_CONFIGURED',{credentialVariables:config.variables,blockers:absent.map(key=>'credential_missing:'+key)});
  if(typeof fetchImpl!=='function')return result(requested,'UNVERIFIED',{credentialVariables:config.variables,warnings:['fetch_unavailable']});
  const token=String(env[config.variables[0]]).trim();
  const checks=[];
  try{
    const {response,payload}=await requestJson(fetchImpl,config.endpoint,token,config.headers,timeoutMs);
    if(requested!=='cloudflare'){
      checks.push(classifyResponse('credential_identity',response,payload,config.identity));
    }else{
      let tokenCheck;
      if(response.status===401||response.status===403)tokenCheck={name:'token_status',status:'BLOCKED',httpStatus:response.status,reason:'credential_rejected_or_permissions_insufficient'};
      else if(response.status===429||response.status>=500)tokenCheck={name:'token_status',status:'UNVERIFIED',httpStatus:response.status,reason:'provider_service_unavailable'};
      else if(!response.ok)tokenCheck={name:'token_status',status:'BLOCKED',httpStatus:response.status,reason:'credential_probe_http_error'};
      else if(!payload||payload.success!==true||!payload.result)tokenCheck={name:'token_status',status:'UNVERIFIED',httpStatus:response.status,reason:'invalid_provider_response'};
      else if(payload.result.status!=='active')tokenCheck={name:'token_status',status:payload.result.status?'BLOCKED':'UNVERIFIED',httpStatus:response.status,reason:payload.result.status?'token_not_active':'token_status_missing'};
      else tokenCheck={name:'token_status',status:'PASS',httpStatus:response.status,reason:'active_token_confirmed'};
      checks.push(tokenCheck);
      if(tokenCheck.status==='PASS'){
        const accountId=String(env.CLOUDFLARE_ACCOUNT_ID).trim();
        try{
          const account=await requestJson(fetchImpl,'https://api.cloudflare.com/client/v4/accounts/'+encodeURIComponent(accountId),token,config.headers,timeoutMs);
          checks.push(classifyResponse('account_access',account.response,account.payload,body=>body.success===true&&String(body.result?.id||'')===accountId));
        }catch{
          checks.push({name:'account_access',status:'UNVERIFIED',httpStatus:null,reason:'provider_network_or_timeout'});
        }
      }
    }
  }catch{
    checks.push({name:requested==='cloudflare'?'token_status':'credential_identity',status:'UNVERIFIED',httpStatus:null,reason:'provider_network_or_timeout'});
  }
  const status=finalStatus(checks);
  const warnings=['read_only_authentication_probe_does_not_prove_publish_or_write_permissions'];
  if(requested==='hostinger')warnings.push('github_identity_verified; target_repository_write_permissions_not_proven');
  return result(requested,status,{credentialVariables:config.variables,checks,blockers:checks.filter(x=>x.status==='BLOCKED').map(x=>x.reason),warnings,writeAccessVerified:false});
}
