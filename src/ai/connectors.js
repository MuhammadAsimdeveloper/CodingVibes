const DEFINITIONS = [
  {id:'omniroute',label:'OmniRoute',kind:'ai-gateway',protocol:'openai-compatible',baseUrl:'http://127.0.0.1:20128/v1',apiKeyEnv:'OMNIROUTE_API_KEY',aliases:['omni','omniroute']},
  {id:'openrouter',label:'OpenRouter',kind:'ai-gateway',protocol:'openai-compatible',baseUrl:'https://openrouter.ai/api/v1',apiKeyEnv:'OPENROUTER_API_KEY',aliases:['router']},
  {id:'openai',label:'OpenAI',kind:'model-provider',protocol:'openai-compatible',baseUrl:'https://api.openai.com/v1',apiKeyEnv:'OPENAI_API_KEY'},
  {id:'deepseek',label:'DeepSeek',kind:'model-provider',protocol:'openai-compatible',baseUrl:'https://api.deepseek.com/v1',apiKeyEnv:'DEEPSEEK_API_KEY'},
  {id:'groq',label:'Groq',kind:'model-provider',protocol:'openai-compatible',baseUrl:'https://api.groq.com/openai/v1',apiKeyEnv:'GROQ_API_KEY'},
  {id:'mistral',label:'Mistral',kind:'model-provider',protocol:'openai-compatible',baseUrl:'https://api.mistral.ai/v1',apiKeyEnv:'MISTRAL_API_KEY'},
  {id:'xai',label:'xAI',kind:'model-provider',protocol:'openai-compatible',baseUrl:'https://api.x.ai/v1',apiKeyEnv:'XAI_API_KEY'},
  {id:'cerebras',label:'Cerebras',kind:'model-provider',protocol:'openai-compatible',baseUrl:'https://api.cerebras.ai/v1',apiKeyEnv:'CEREBRAS_API_KEY'},
  {id:'together',label:'Together AI',kind:'model-provider',protocol:'openai-compatible',baseUrl:'https://api.together.xyz/v1',apiKeyEnv:'TOGETHER_API_KEY'},
  {id:'fireworks',label:'Fireworks AI',kind:'model-provider',protocol:'openai-compatible',baseUrl:'https://api.fireworks.ai/inference/v1',apiKeyEnv:'FIREWORKS_API_KEY'},
  {id:'anthropic',label:'Anthropic',kind:'model-provider',protocol:'anthropic-messages',baseUrl:'https://api.anthropic.com/v1',apiKeyEnv:'ANTHROPIC_API_KEY'},
  {id:'ollama',label:'Ollama',kind:'local',protocol:'openai-compatible',baseUrl:'http://127.0.0.1:11434/v1',apiKeyEnv:null,aliases:['local']},
  {id:'lmstudio',label:'LM Studio',kind:'local',protocol:'openai-compatible',baseUrl:'http://127.0.0.1:1234/v1',apiKeyEnv:null,aliases:['lm-studio']},
  {id:'custom',label:'Custom OpenAI-compatible',kind:'custom',protocol:'openai-compatible',baseUrl:'',apiKeyEnv:'CODINGVIBES_CUSTOM_API_KEY',aliases:['openai-compatible']}
];

const byId=new Map(DEFINITIONS.flatMap(d=>[d,...(d.aliases||[]).map(a=>({...d,id:a,aliasOf:d.id}))].map(d=>[d.id,d])));

function profileFor(env,id){
  try{const raw=JSON.parse(env.CODINGVIBES_MODEL_PROFILES||'{}');const p=raw?.[id];return p&&typeof p==='object'?p:{};}catch{return {};}
}

export function getConnectorDefinition(id){return byId.get(String(id||'').toLowerCase())||null;}
export function listConnectorDefinitions(){return DEFINITIONS.map(d=>({...d,aliases:[...(d.aliases||[])]}));}

export function resolveConnector(id,env=process.env){
  const definition=getConnectorDefinition(id)||getConnectorDefinition('custom');
  const canonical=definition.aliasOf||definition.id;
  const profile=profileFor(env,canonical);
  const baseUrl=String(profile.baseUrl||env[`CODINGVIBES_${canonical.toUpperCase()}_BASE_URL`]||env.CODINGVIBES_BASE_URL||(canonical==='custom'?'':definition.baseUrl)).replace(/\/$/,'');
  const apiKeyName=profile.apiKeyEnv||definition.apiKeyEnv;
  const apiKey=String(profile.apiKey||((apiKeyName&&env[apiKeyName])||''));
  const configured=definition.protocol==='openai-compatible' ? Boolean(baseUrl && (!apiKeyName||apiKey||['ollama','lmstudio'].includes(canonical))) : Boolean(baseUrl&&apiKey);
  return {id:canonical,label:definition.label,kind:definition.kind,protocol:definition.protocol,baseUrl,apiKey,apiKeyEnv:apiKeyName,configured,models:profile.models||{}};
}

export function configuredConnectors(env=process.env){return DEFINITIONS.map(d=>resolveConnector(d.id,env)).filter(c=>c.configured);}

export function parseProviderChain(env=process.env){
  const raw=String(env.CODINGVIBES_PROVIDER_CHAIN||'').split(',').map(x=>x.trim()).filter(Boolean);
  const primary=String(env.CODINGVIBES_PROVIDER||'openai').toLowerCase();
  const chain=[primary,...raw,'omniroute','openrouter'].map(x=>(getConnectorDefinition(x)?.aliasOf||x).toLowerCase());
  return [...new Set(chain)];
}
