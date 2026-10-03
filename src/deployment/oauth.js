import crypto from 'node:crypto';

const CONFIG={
 github:{authorize:'https://github.com/login/oauth/authorize',token:'https://github.com/login/oauth/access_token',scope:'repo read:user user:email',clientId:'GITHUB_CLIENT_ID',clientSecret:'GITHUB_CLIENT_SECRET',redirect:'GITHUB_REDIRECT_URI'},
 vercel:{authorize:'https://vercel.com/oauth/authorize',token:'https://api.vercel.com/login/oauth/token',scope:'openid user:read',clientId:'VERCEL_CLIENT_ID',clientSecret:'VERCEL_CLIENT_SECRET',redirect:'VERCEL_REDIRECT_URI'},
 netlify:{authorize:'https://app.netlify.com/authorize',token:'https://api.netlify.com/oauth/tickets',scope:'read write',clientId:'NETLIFY_CLIENT_ID',clientSecret:'NETLIFY_CLIENT_SECRET',redirect:'NETLIFY_REDIRECT_URI'},
 cloudflare:{authorize:'https://dash.cloudflare.com/oauth2/auth',token:'https://dash.cloudflare.com/oauth2/token',scope:'openid offline_access',clientId:'CLOUDFLARE_CLIENT_ID',clientSecret:'CLOUDFLARE_CLIENT_SECRET',redirect:'CLOUDFLARE_REDIRECT_URI'}
};

const pending=new Map();
function cfg(provider){const c=CONFIG[provider];if(!c)throw Object.assign(new Error('unsupported_oauth_provider'),{status:400});if(!process.env[c.clientId]||!process.env[c.clientSecret]||!process.env[c.redirect])throw Object.assign(new Error(provider+'_oauth_not_configured'),{status:503});return c}
function verifier(){return crypto.randomBytes(32).toString('base64url')}
function challenge(v){return crypto.createHash('sha256').update(v).digest('base64url')}
export function oauthConfigured(provider){try{cfg(provider);return true}catch{return false}}
export function beginOAuth(store,provider,{userId,redirectAfter='/app'}={}){
 const c=cfg(provider),state=crypto.randomBytes(24).toString('base64url'),codeVerifier=verifier();const created=Date.now(),expiresAt=new Date(created+10*60*1000).toISOString();store.createOAuthState(userId,provider,state,expiresAt,{redirectAfter,codeVerifier});
 const u=new URL(c.authorize);u.searchParams.set('client_id',process.env[c.clientId]);u.searchParams.set('redirect_uri',process.env[c.redirect]);u.searchParams.set('response_type','code');u.searchParams.set('state',state);u.searchParams.set('code_challenge',challenge(codeVerifier));u.searchParams.set('code_challenge_method','S256');if(c.scope)u.searchParams.set('scope',c.scope);return u.toString();
}
export async function completeOAuth(store,provider,{code,state}={}){
 const c=cfg(provider),row=store.consumeOAuthState(provider,String(state||''));const meta=row?{provider:row.provider,userId:row.user_id,redirectAfter:row.metadata?.redirectAfter||'/app',codeVerifier:row.metadata?.codeVerifier}:null;if(!meta)throw Object.assign(new Error('oauth_state_invalid'),{status:400});
 let body={grant_type:'authorization_code',client_id:process.env[c.clientId],client_secret:process.env[c.clientSecret],redirect_uri:process.env[c.redirect],code:String(code||''),code_verifier:meta.codeVerifier};
 if(provider==='netlify'){const ticket=await fetch('https://api.netlify.com/api/v1/oauth/tickets/'+encodeURIComponent(String(code||''))+'/exchange',{method:'POST',headers:{accept:'application/json','content-type':'application/json'},body:'{}'});const tj=await ticket.json();if(!ticket.ok||!tj.access_token)throw Object.assign(new Error('netlify_oauth_ticket_exchange_failed'),{status:502});return {provider,userId:meta.userId,secret:JSON.stringify({accessToken:tj.access_token}),metadata:{oauth:true,email:tj.user_email||null,userId:tj.user_id||null},redirectAfter:meta.redirectAfter};}
 const res=await fetch(c.token,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded','accept':'application/json'},body:new URLSearchParams(body)});const raw=await res.text();let data={};try{data=JSON.parse(raw)}catch{}
 if(!res.ok||!(data.access_token||data.accessToken||data.token))throw Object.assign(new Error(provider+'_oauth_token_exchange_failed'),{status:502});
 const accessToken=data.access_token||data.accessToken||data.token;let metadata={oauth:true};if(data.refresh_token)metadata.refreshTokenPresent=true;if(data.expires_in)metadata.expiresAt=new Date(Date.now()+Number(data.expires_in)*1000).toISOString();
 if(provider==='cloudflare'){try{const info=await fetch('https://dash.cloudflare.com/oauth2/userinfo',{headers:{authorization:'Bearer '+accessToken}}).then(r=>r.json());metadata.email=info.email||null;metadata.name=info.name||null;metadata.accountId=info.account_id||null;}catch{}}
 if(provider==='vercel'){try{const info=await fetch('https://api.vercel.com/login/oauth/userinfo',{headers:{authorization:'Bearer '+accessToken}}).then(r=>r.json());metadata.email=info.email||null;metadata.name=info.name||null;metadata.userId=info.user?.id||info.id||null;}catch{}}
 if(provider==='github'){try{const info=await fetch('https://api.github.com/user',{headers:{authorization:'Bearer '+accessToken,'X-GitHub-Api-Version':'2026-03-10'}}).then(r=>r.json());metadata.login=info.login||null;metadata.name=info.name||null;}catch{}}
 return {provider,userId:meta.userId,secret:JSON.stringify({accessToken,refreshToken:data.refresh_token||null}),metadata,redirectAfter:meta.redirectAfter};
}
