import crypto from 'node:crypto';
const ENVIRONMENTS=new Set(['development','staging','production','test']);
const sanitizeConfig=(value,depth=0)=>{
  if(depth>5)return '[depth-limited]';
  if(Array.isArray(value))return value.slice(0,100).map(x=>sanitizeConfig(x,depth+1));
  if(value&&typeof value==='object'){
    const out=Object.create(null);
    for(const [k,v] of Object.entries(value).slice(0,100)){
      if(k==='__proto__'||k==='constructor'||k==='prototype')continue;
      out[String(k).slice(0,100)]=sanitizeConfig(v,depth+1);
    }
    return out;
  }
  return typeof value==='string'?value.slice(0,4000):value;
};
function normalizeEnvironments(value){const xs=Array.isArray(value)?value:typeof value==='string'?value.split(','):['development','staging','production'];const out=[...new Set(xs.map(x=>String(x).trim().toLowerCase()).filter(x=>ENVIRONMENTS.has(x)))];return out.length?out:['development','staging','production'];}
export function normalizeFeatureFlag(input={}){
  const key=String(input.key||'').trim().toLowerCase();
  if(!/^[a-z0-9][a-z0-9_.:-]{1,100}$/.test(key))throw new Error('invalid_feature_flag_key');
  return{key,enabled:input.enabled!==false,rolloutPercentage:Math.min(100,Math.max(0,Number(input.rolloutPercentage??input.rollout_percentage??100)||0)),environments:normalizeEnvironments(input.environments),killSwitch:Boolean(input.killSwitch??input.kill_switch??false),config:sanitizeConfig(input.config&&typeof input.config==='object'&&!Array.isArray(input.config)?input.config:{})};
}
export function evaluateFeatureFlag(flag,{userId='',projectId='',environment=process.env.NODE_ENV||'development'}={}){
  const f=normalizeFeatureFlag(flag),env=String(environment).toLowerCase();
  if(!f.enabled)return{enabled:false,reason:'disabled',config:{}};
  if(f.killSwitch)return{enabled:false,reason:'kill_switch',config:{}};
  if(!f.environments.includes(env))return{enabled:false,reason:'environment_disabled',config:{}};
  if(f.rolloutPercentage>=100)return{enabled:true,reason:'full_rollout',config:f.config};
  const seed=crypto.createHash('sha256').update(f.key+':'+String(userId||projectId||'anonymous')).digest('hex').slice(0,8);
  const bucket=(parseInt(seed,16)/0xffffffff)*100;
  const enabled=bucket<f.rolloutPercentage;
  return{enabled,reason:enabled?'rollout_enabled':'rollout_excluded',bucket:Number(bucket.toFixed(4)),config:enabled?f.config:{}};
}
