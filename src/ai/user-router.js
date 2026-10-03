import {ModelRouter} from './router.js';
import {decryptSecret} from '../security/vault.js';
import {getConnectorDefinition} from './connectors.js';

function canonicalProvider(id){
  const d=getConnectorDefinition(String(id||'').trim().toLowerCase());
  if(!d)throw new Error('unknown_provider');
  return d.aliasOf||d.id;
}
function safeBaseUrl(value){
  if(value==null||String(value).trim()==='')return null;
  let u;try{u=new URL(String(value).trim())}catch{throw new Error('invalid_base_url');}
  const host=u.hostname.toLowerCase();
  const local=['localhost','127.0.0.1','::1'].includes(host)||/^127\./.test(host);
  if(u.username||u.password)throw new Error('unsafe_base_url');
  if(u.protocol!=='https:'&&!(u.protocol==='http:'&&local))throw new Error('unsafe_base_url');
  return u.toString().replace(/\/$/,'');
}
export function providerConnectionInput(input={}){
  const provider=canonicalProvider(input.provider);
  const apiKey=String(input.apiKey||'').trim();
  const baseUrl=safeBaseUrl(input.baseUrl);
  const defaultModel=String(input.defaultModel||'').trim().slice(0,200);
  const d=getConnectorDefinition(provider);
  if(d?.apiKeyEnv&&!['ollama','lmstudio'].includes(provider)&&!apiKey)throw new Error('api_key_required');
  if(provider==='custom'&&!baseUrl)throw new Error('base_url_required');
  return {provider,apiKey,baseUrl,defaultModel:defaultModel||null};
}
export function normalizeAiSettings(input={}){
  const primary=input.primary?canonicalProvider(input.primary):null;
  const raw=Array.isArray(input.chain)?input.chain:primary?[primary]:[];
  const chain=[...new Set(raw.filter(Boolean).map(c=>{try{return canonicalProvider(c)}catch{return null}}).filter(Boolean))].slice(0,12);
  if(primary&&!chain.includes(primary))chain.unshift(primary);
  const defaultModels={};
  for(const tier of ['cheap','standard','premium']){const value=String(input.defaultModels?.[tier]||'').trim();if(value)defaultModels[tier]=value.slice(0,200);}
  return {primary:primary||chain[0]||'openai',chain:chain.length?chain:[primary||'openai'],defaultModels};
}
export function buildUserRouter({env=process.env,connections=[],settings={}}={}){
  const normalized=(connections||[]).map(c=>({provider:canonicalProvider(c.provider),apiKey:String(c.apiKey||''),baseUrl:c.baseUrl||null,defaultModel:c.defaultModel||null,enabled:c.enabled!==false}));
  return new ModelRouter(env,{connections:normalized,settings:normalizeAiSettings(settings)});
}
export {canonicalProvider,safeBaseUrl};

export function buildUserRouterForUser({store,userId,env=process.env}={}){
  const settings=store.getAiSettings(userId);
  const connections=[];
  for(const row of store.listProviderConnections(userId)){
    try{
      const secure=store.getProviderConnectionSecret(userId,row.provider);
      const secret=JSON.parse(decryptSecret(secure?.secret_ciphertext||'{}'));
      connections.push({provider:row.provider,apiKey:String(secret.apiKey||''),baseUrl:secret.baseUrl||null,defaultModel:row.metadata?.defaultModel||null,enabled:row.metadata?.enabled!==false});
    }catch{}
  }
  return buildUserRouter({env,connections,settings});
}
