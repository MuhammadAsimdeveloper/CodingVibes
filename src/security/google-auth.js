import crypto from 'node:crypto';

const STATE_COOKIE='bv_google_oauth_state';
const AUTH_ENDPOINT='https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT='https://oauth2.googleapis.com/token';
const USERINFO_ENDPOINT='https://openidconnect.googleapis.com/v1/userinfo';

function cfg(env=process.env){
  const clientId=String(env.GOOGLE_CLIENT_ID||'').trim();
  const clientSecret=String(env.GOOGLE_CLIENT_SECRET||'').trim();
  const redirectUri=String(env.GOOGLE_REDIRECT_URI||'').trim();
  return {clientId,clientSecret,redirectUri};
}

export function googleOAuthConfigured(env=process.env){
  const {clientId,clientSecret,redirectUri}=cfg(env);
  return Boolean(clientId&&clientSecret&&redirectUri);
}

function requireConfig(env=process.env){
  const config=cfg(env);
  if(!config.clientId||!config.clientSecret||!config.redirectUri){
    throw Object.assign(new Error('google_oauth_not_configured'),{status:503});
  }
  return config;
}

function makeCodeVerifier(){
  return crypto.randomBytes(48).toString('base64url');
}

function codeChallenge(value){
  return crypto.createHash('sha256').update(value).digest('base64url');
}

function stateCookieHeader(state,maxAge=600){
  const secure=process.env.NODE_ENV==='production'?'; Secure':'';
  return STATE_COOKIE+'='+encodeURIComponent(String(state))+'; Path=/; HttpOnly; SameSite=Lax; Max-Age='+String(maxAge)+secure;
}

export function createGoogleAuthorization({state,codeVerifier},env=process.env){
  const config=requireConfig(env);
  const challenge=codeChallenge(String(codeVerifier));
  const url=new URL(AUTH_ENDPOINT);
  url.searchParams.set('client_id',config.clientId);
  url.searchParams.set('redirect_uri',config.redirectUri);
  url.searchParams.set('response_type','code');
  url.searchParams.set('scope','openid email profile');
  url.searchParams.set('state',String(state));
  url.searchParams.set('code_challenge',challenge);
  url.searchParams.set('code_challenge_method','S256');
  url.searchParams.set('include_granted_scopes','true');
  return {url:url.toString(),codeChallenge:challenge};
}

export function setGoogleOAuthStateCookie(res,state){
  res.setHeader('Set-Cookie',stateCookieHeader(state));
}

export function clearGoogleOAuthStateCookieHeader(){
  return stateCookieHeader('',0);
}

export function readGoogleOAuthStateCookie(req){
  const header=String(req.headers.cookie||'');
  const item=header.split(';').map(x=>x.trim()).find(x=>x.startsWith(STATE_COOKIE+'='));
  if(!item)return null;
  try{return decodeURIComponent(item.slice(STATE_COOKIE.length+1));}catch{return null;}
}

export function beginGoogleOAuth(store,{redirectAfter='/app',env=process.env}={}){
  requireConfig(env);
  const state=crypto.randomBytes(32).toString('base64url');
  const verifier=makeCodeVerifier();
  const expiresAt=new Date(Date.now()+10*60*1000).toISOString();
  store.createGoogleAuthState(state,expiresAt,{redirectAfter:String(redirectAfter||'/app'),codeVerifier:verifier});
  const auth=createGoogleAuthorization({state,codeVerifier:verifier},env);
  return {url:auth.url,state,expiresAt,stateCookie:stateCookieHeader(state)};
}

export function consumeGoogleOAuthState(store,state){
  return store.consumeGoogleAuthState(String(state||''));
}

async function jsonResponse(response,code){
  const raw=await response.text();
  let body={};
  try{body=JSON.parse(raw||'{}');}catch{}
  if(!response.ok)throw Object.assign(new Error(code),{status:502});
  return body;
}

export async function completeGoogleOAuth(store,{code,state,env=process.env,fetchImpl=fetch}={}){
  const config=requireConfig(env);
  const row=store.consumeGoogleAuthState(String(state||''));
  if(!row)throw Object.assign(new Error('oauth_state_invalid'),{status:400});
  if(!String(code||''))throw Object.assign(new Error('google_authorization_code_missing'),{status:400});
  const metadata=row.metadata||{};
  const tokenResponse=await fetchImpl(TOKEN_ENDPOINT,{
    method:'POST',
    headers:{'content-type':'application/x-www-form-urlencoded',accept:'application/json'},
    body:new URLSearchParams({
      code:String(code),
      client_id:config.clientId,
      client_secret:config.clientSecret,
      redirect_uri:config.redirectUri,
      grant_type:'authorization_code',
      code_verifier:String(metadata.codeVerifier||'')
    })
  });
  const tokens=await jsonResponse(tokenResponse,'google_token_exchange_failed');
  const accessToken=String(tokens.access_token||'');
  if(!accessToken)throw Object.assign(new Error('google_token_exchange_failed'),{status:502});
  const profileResponse=await fetchImpl(USERINFO_ENDPOINT,{headers:{accept:'application/json',authorization:'Bearer '+accessToken}});
  const profile=await jsonResponse(profileResponse,'google_profile_request_failed');
  const email=String(profile.email||'').trim().toLowerCase();
  const subject=String(profile.sub||'').trim();
  const emailVerified=profile.email_verified===true;
  if(!subject||!email)throw Object.assign(new Error('google_profile_invalid'),{status:502});
  if(!emailVerified)throw Object.assign(new Error('google_email_not_verified'),{status:403});
  return {
    provider:'google',
    profile:{
      sub:subject,
      email,
      emailVerified,
      name:String(profile.name||'').trim().slice(0,160),
      givenName:String(profile.given_name||'').trim().slice(0,120),
      familyName:String(profile.family_name||'').trim().slice(0,120),
      picture:String(profile.picture||'').trim().slice(0,1000)
    },
    redirectAfter:String(metadata.redirectAfter||'/app')
  };
}
