import test from 'node:test';
import assert from 'node:assert/strict';
import fs,{mkdtempSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('Google OAuth is disabled unless all production credentials are configured',async()=>{
  const {googleOAuthConfigured}=await import('../src/security/google-auth.js?config-test');
  assert.equal(googleOAuthConfigured({GOOGLE_CLIENT_ID:'id',GOOGLE_CLIENT_SECRET:'secret'}),false);
  assert.equal(googleOAuthConfigured({
    GOOGLE_CLIENT_ID:'id',
    GOOGLE_CLIENT_SECRET:'secret',
    GOOGLE_REDIRECT_URI:'https://buildvibe.example.com/api/auth/google/callback'
  }),true);
});

test('Google authorization URL uses state, PKCE and the configured callback',async()=>{
  const {createGoogleAuthorization}=await import('../src/security/google-auth.js?url-test');
  const env={
    GOOGLE_CLIENT_ID:'google-client',
    GOOGLE_CLIENT_SECRET:'secret',
    GOOGLE_REDIRECT_URI:'https://buildvibe.example.com/api/auth/google/callback'
  };
  const result=createGoogleAuthorization({state:'state-123',codeVerifier:'verifier-123'},env);
  const url=new URL(result.url);
  assert.equal(url.origin,'https://accounts.google.com');
  assert.equal(url.pathname,'/o/oauth2/v2/auth');
  assert.equal(url.searchParams.get('client_id'),'google-client');
  assert.equal(url.searchParams.get('redirect_uri'),env.GOOGLE_REDIRECT_URI);
  assert.equal(url.searchParams.get('response_type'),'code');
  assert.equal(url.searchParams.get('state'),'state-123');
  assert.equal(url.searchParams.get('code_challenge_method'),'S256');
  assert.ok(url.searchParams.get('code_challenge'));
  assert.match(url.searchParams.get('scope')||'',/openid/);
  assert.match(url.searchParams.get('scope')||'',/email/);
  assert.match(url.searchParams.get('scope')||'',/profile/);
});

test('Google OAuth state is one-time and bound to a browser cookie contract',async()=>{
  const {Store}=await import('../src/db/store.js?google-state');
  const {beginGoogleOAuth,consumeGoogleOAuthState}=await import('../src/security/google-auth.js?state-test');
  const dir=mkdtempSync(path.join(os.tmpdir(),'bv-google-'));
  const store=new Store(path.join(dir,'x.db'));
  const previous={...process.env};
  try{
    Object.assign(process.env,{
      GOOGLE_CLIENT_ID:'google-client',
      GOOGLE_CLIENT_SECRET:'secret',
      GOOGLE_REDIRECT_URI:'https://buildvibe.example.com/api/auth/google/callback'
    });
    const started=beginGoogleOAuth(store,{redirectAfter:'/app'});
    assert.match(started.stateCookie,/HttpOnly/);
    assert.match(started.stateCookie,/SameSite=Lax/);
    const consumed=consumeGoogleOAuthState(store,started.state);
    assert.equal(consumed.metadata.redirectAfter,'/app');
    assert.equal(consumeGoogleOAuthState(store,started.state),null);
  } finally {
    for(const k of Object.keys(process.env))if(!(k in previous))delete process.env[k];
    for(const [k,v] of Object.entries(previous))process.env[k]=v;
    store.close();
  }
});

test('Google authorization callback exchanges code and requires a verified email',async()=>{
  const {completeGoogleOAuth}=await import('../src/security/google-auth.js?complete-test');
  const calls=[];
  const fetchImpl=async(url,options={})=>{
    calls.push({url,options});
    if(String(url).includes('/token'))return new Response(JSON.stringify({access_token:'access-123',expires_in:3600}),{status:200,headers:{'content-type':'application/json'}});
    return new Response(JSON.stringify({sub:'google-sub-1',email:'person@example.com',email_verified:true,name:'Person',picture:'https://lh.example/avatar'}),{status:200,headers:{'content-type':'application/json'}});
  };
  const store={
    consumeGoogleAuthState:()=>({user_id:null,provider:'google',metadata:{redirectAfter:'/app',codeVerifier:'verifier'}})
  };
  const result=await completeGoogleOAuth(store,{code:'auth-code',state:'state',env:{
    GOOGLE_CLIENT_ID:'google-client',
    GOOGLE_CLIENT_SECRET:'secret',
    GOOGLE_REDIRECT_URI:'https://buildvibe.example.com/api/auth/google/callback'
  },fetchImpl});
  assert.equal(result.profile.sub,'google-sub-1');
  assert.equal(result.profile.email,'person@example.com');
  assert.equal(result.profile.emailVerified,true);
  assert.equal(calls.length,2);
  assert.match(String(calls[0].options.body),/code=auth-code/);
  assert.match(String(calls[0].options.body),/code_verifier=verifier/);
});

test('Google authorization callback rejects an unverified email',async()=>{
  const {completeGoogleOAuth}=await import('../src/security/google-auth.js?unverified');
  const fetchImpl=async(url)=>{
    if(String(url).includes('/token'))return new Response(JSON.stringify({access_token:'access-123'}),{status:200});
    return new Response(JSON.stringify({sub:'google-sub-2',email:'unverified@example.com',email_verified:false}),{status:200});
  };
  const store={consumeGoogleAuthState:()=>({user_id:null,metadata:{redirectAfter:'/app',codeVerifier:'verifier'}})};
  await assert.rejects(
    completeGoogleOAuth(store,{code:'auth-code',state:'state',env:{
      GOOGLE_CLIENT_ID:'google-client',
      GOOGLE_CLIENT_SECRET:'secret',
      GOOGLE_REDIRECT_URI:'https://buildvibe.example.com/api/auth/google/callback'
    },fetchImpl}),
    error=>error?.message==='google_email_not_verified'
  );
});

test('Google identities can link to the existing user without exposing credentials',async()=>{
  const {Store}=await import('../src/db/store.js?identity-test');
  const dir=mkdtempSync(path.join(os.tmpdir(),'bv-google-identity-'));
  const store=new Store(path.join(dir,'x.db'));
  const user=store.createUser('person@example.com','hash');
  const identity=store.createAuthIdentity(user.id,{provider:'google',subject:'google-sub-1',email:'person@example.com',metadata:{name:'Person',picture:'https://lh.example/avatar'}});
  assert.equal(identity.user_id,user.id);
  assert.equal(store.getAuthIdentity('google','google-sub-1').user_id,user.id);
  assert.equal(store.listAuthIdentities(user.id)[0].provider,'google');
  assert.equal(JSON.stringify(store.listAuthIdentities(user.id)).includes('hash'),false);
  store.close();
});

test('auth and app UI expose both email and Google entry points',()=>{
  const html=fs.readFileSync('public/index.html','utf8');
  const studio=fs.readFileSync('public/studio.js','utf8');
  assert.match(html,/Continue with Google/);
  assert.match(html,/id="googleBtn"/);
  assert.ok(studio.includes('/api/auth/google'));
});

test('Build Vibe server has Google auth routes and no client-side secret dependency',()=>{
  const server=fs.readFileSync('src/server.js','utf8');
  const env=fs.readFileSync('.env.example','utf8');
  assert.match(server,/\/api\/auth\/google\/config/);
  assert.match(server,/\/api\/auth\/google\/callback/);
  assert.match(server,/readGoogleOAuthStateCookie\(req\)/);
  assert.match(server,/setGoogleOAuthStateCookie\(res,started\.state\)/);
  assert.match(server,/sessionCookieHeader\(signSession\(session\.id\)\)/);
  assert.match(env,/GOOGLE_CLIENT_ID=/);
  assert.match(env,/GOOGLE_CLIENT_SECRET=/);
  assert.match(env,/GOOGLE_REDIRECT_URI=/);
  assert.doesNotMatch(fs.readFileSync('public/studio.js','utf8'),/GOOGLE_CLIENT_SECRET/);
});
