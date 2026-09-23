const DEFINITIONS=[
 {id:'github',label:'GitHub',kind:'source-control',baseUrl:'https://api.github.com',tokenEnv:'GITHUB_TOKEN',health:{method:'GET',path:'/user'}},
 {id:'vercel',label:'Vercel',kind:'deployment',baseUrl:'https://api.vercel.com',tokenEnv:'VERCEL_TOKEN',health:{method:'GET',path:'/v2/user'}},
 {id:'supabase',label:'Supabase',kind:'backend',baseUrl:'',tokenEnv:'SUPABASE_SERVICE_ROLE_KEY',urlEnv:'SUPABASE_URL',health:{method:'GET',path:'/rest/v1/'}},
 {id:'cloudflare',label:'Cloudflare',kind:'deployment',baseUrl:'https://api.cloudflare.com',tokenEnv:'CLOUDFLARE_API_TOKEN',health:{method:'GET',path:'/client/v4/user/tokens/verify'}},
 {id:'stripe',label:'Stripe',kind:'payments',baseUrl:'https://api.stripe.com',tokenEnv:'STRIPE_SECRET_KEY',health:{method:'GET',path:'/v1/account'}},
 {id:'sentry',label:'Sentry',kind:'observability',baseUrl:'https://sentry.io',tokenEnv:'SENTRY_AUTH_TOKEN',health:{method:'GET',path:'/api/0/'}},
 {id:'neon',label:'Neon',kind:'database',baseUrl:'https://console.neon.tech/api/v2',tokenEnv:'NEON_API_KEY',health:{method:'GET',path:'/projects'}},
 {id:'slack',label:'Slack',kind:'notifications',baseUrl:'https://slack.com/api',tokenEnv:'SLACK_BOT_TOKEN',health:{method:'GET',path:'/auth.test'}}
];
function resolve(def,env=process.env){const base=(env[def.urlEnv]||env[`CODINGVIBES_${def.id.toUpperCase()}_URL`]||def.baseUrl||'').replace(/\/$/,'');const token=env[def.tokenEnv]||'';return {id:def.id,label:def.label,kind:def.kind,baseUrl:base,configured:Boolean(base&&token),tokenConfigured:Boolean(token)};}
export function listIntegrationDefinitions(env=process.env){return DEFINITIONS.map(d=>({...d,baseUrl:undefined,configured:resolve(d,env).configured,tokenEnv:d.tokenEnv,urlEnv:d.urlEnv||null}));}
export function resolveIntegration(id,env=process.env){const def=DEFINITIONS.find(x=>x.id===String(id).toLowerCase());if(!def)return null;return{...def,...resolve(def,env)};}
function headers(c){if(c.id==='stripe')return{authorization:`Bearer ${c.token}`};if(c.id==='supabase')return{apikey:c.token,authorization:`Bearer ${c.token}`};return{authorization:`Bearer ${c.token}`,'user-agent':'codingVibes/2.9'};}
export async function testIntegration(id,env=process.env){const def=DEFINITIONS.find(x=>x.id===String(id).toLowerCase());if(!def)return{ok:false,error:'unknown_integration'};const c=resolve(def,env);if(!c.configured)return{ok:false,error:'integration_not_configured',integration:id};const full=`${c.baseUrl}${def.health.path}`;try{const r=await fetch(full,{method:def.health.method,headers:headers({...c,token:env[def.tokenEnv]})});let body='';try{body=await r.text();}catch{}return{ok:r.ok,status:r.status,integration:id,label:def.label,endpoint:def.health.path,response:body.slice(0,500).replace(/\s+/g,' ')};}catch(e){return{ok:false,integration:id,error:e.message};}}
