import {featureCatalog,hasFeature,featureGate} from './features.js';

export const PLANS = {
  free: {
    id: 'free', label: 'Free', monthlyRuns: 5, monthlyTokens: 250000, priceUsd: 0, priceEnv: null, paddlePriceEnv: null,
    creationLimits: {basic:3, '3d':1, animated:1, apk:0},
    quotas: {basicProjects:3, threeDProjects:1, animatedProjects:1, apkProjects:0},
    features: ['basic_site','visual_builder','basic_seo','three_d_creation','animated_creation','assistant_history','local_llm','catalog_3d'],
    videoTrialSeconds: Number(process.env.CODINGVIBES_VIDEO_TRIAL_SECONDS || 5),
    videoSeconds: 0,
  },
  pro: {
    id: 'pro', label: 'Pro', priceUsd: 7, monthlyRuns: 100, monthlyTokens: 5000000, priceEnv: 'STRIPE_PRICE_PRO_MONTHLY', paddlePriceEnv: 'PADDLE_PRICE_PRO_MONTHLY',
    creationLimits: {basic:25, '3d':10, animated:25, apk:10},
    quotas: {basicProjects:25, threeDProjects:10, animatedProjects:25, apkProjects:10},
    features: ['basic_site','visual_builder','basic_seo','three_d_creation','animated_creation','assistant_history','local_llm','catalog_3d','native_apk','advanced_animation','ai_video','advanced_seo','deployment','private_projects','custom_domain','team_collaboration','audit_export','scaleout'],
    videoTrialSeconds: 0,
    videoSeconds: Number(process.env.CODINGVIBES_PRO_VIDEO_SECONDS || 120),
  },
  team: {
    id: 'team', label: 'Team', priceUsd: 15, monthlyRuns: 1000, monthlyTokens: 25000000, priceEnv: 'STRIPE_PRICE_TEAM_MONTHLY', paddlePriceEnv: 'PADDLE_PRICE_TEAM_MONTHLY',
    creationLimits: {basic:100, '3d':50, animated:100, apk:40},
    quotas: {basicProjects:100, threeDProjects:50, animatedProjects:100, apkProjects:40},
    features: ['three_d_creation','animated_creation','assistant_history','local_llm','catalog_3d','basic_site','visual_builder','basic_seo','advanced_animation','ai_video','advanced_seo','deployment','private_projects','custom_domain','team_collaboration','audit_export','scaleout'],
    videoTrialSeconds: 0,
    videoSeconds: Number(process.env.CODINGVIBES_TEAM_VIDEO_SECONDS || 600),
  },
  business: {
    id: 'business', label: 'Business', priceUsd: 39, monthlyRuns: 5000, monthlyTokens: 75000000, priceEnv: 'STRIPE_PRICE_BUSINESS_MONTHLY', paddlePriceEnv: 'PADDLE_PRICE_BUSINESS_MONTHLY',
    creationLimits: {basic:500, '3d':200, animated:500, apk:100},
    quotas: {basicProjects:500, threeDProjects:200, animatedProjects:500, apkProjects:100},
    features: ['three_d_creation','animated_creation','assistant_history','local_llm','catalog_3d','basic_site','visual_builder','basic_seo','advanced_animation','ai_video','advanced_seo','deployment','private_projects','custom_domain','team_collaboration','audit_export','scaleout'],
    videoTrialSeconds: 0, videoSeconds: Number(process.env.CODINGVIBES_BUSINESS_VIDEO_SECONDS || 1800),
  },
  enterprise: {
    id: 'enterprise', label: 'Enterprise', priceUsd: null, monthlyRuns: null, monthlyTokens: null, priceEnv: null, paddlePriceEnv: null,
    creationLimits: {basic:Infinity, '3d':Infinity, animated:Infinity, apk:Infinity},
    quotas: {basicProjects:Infinity, threeDProjects:Infinity, animatedProjects:Infinity, apkProjects:Infinity},
    features: ['three_d_creation','animated_creation','assistant_history','local_llm','catalog_3d','basic_site','visual_builder','basic_seo','advanced_animation','ai_video','advanced_seo','deployment','private_projects','custom_domain','team_collaboration','audit_export','scaleout'],
    videoTrialSeconds: 0, videoSeconds: Infinity,
  }
};

export function quotaForRequest(request='',targetId='',template={}){const t=classifyCreationType(request,targetId,template).type;return ({basic:'basicProjects','3d':'threeDProjects',animated:'animatedProjects',apk:'apkProjects'})[t]||'basicProjects';}
export function buildQuotaSummary(plan='free',usage={}){const p=getPlan(plan),keys=['basicProjects','threeDProjects','animatedProjects','apkProjects'];return Object.fromEntries(keys.map(key=>{const limit=p.quotas?.[key]??0,used=Number(usage?.[key]||0);return [key,{limit,used,remaining:Number.isFinite(limit)?Math.max(0,limit-used):Infinity}]}));}
export function canCreateWithPlan(plan='free',request='',usage={}){const key=quotaForRequest(request),summary=buildQuotaSummary(plan,usage),x=summary[key];return {ok:x.remaining>0,plan:getPlan(plan).id,quota:key,limit:x.limit,used:x.used,remaining:x.remaining};}


export function planCapabilitySummary(plan='free'){
 const p=getPlan(plan);
 return {plan:p.id,label:p.label,priceUsd:p.priceUsd,creationLimits:{...(p.creationLimits||{})},features:[...(p.features||[])],apkAvailable:hasFeature(p.id,'native_apk')};
}

export function getPlan(id = 'free') { return PLANS[id] || PLANS.free; }
export function currentPeriodKey(date = new Date()) { return `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}`; }
export function planCatalog(env = process.env) {
  return Object.values(PLANS).map(p => ({
    ...p, creationLimits:{...(p.creationLimits||{})},
    stripePriceConfigured: Boolean(p.priceEnv && env[p.priceEnv]),
    paddlePriceConfigured: Boolean(p.paddlePriceEnv && env[p.paddlePriceEnv]),
    featureCatalog: featureCatalog(),
  }));
}
export function classifyCreationType(request='',targetId='',template={}) {
  const text=String(request||'').toLowerCase(), target=String(targetId||'').toLowerCase(), experience=String(template?.experience||'').toLowerCase();
  if(/apk|android\s+app|native\s+android|kotlin\s+app|gradle\s+assemble|react\s+native|expo|flutter|ios\s+app/.test(text+' '+target)) return {type:'apk',label:'Android / native app'};
  if(/(^|\W)(3d|3-d|webgl|three\.js|threejs|babylon|spline|immersive|virtual tour|360)(\W|$)/.test(text+' '+experience)) return {type:'3d',label:'3D website'};
  if(/animated|animation|motion design|parallax|scroll animation|gsap|lottie|rive|cinematic motion/.test(text+' '+experience)) return {type:'animated',label:'Animated website'};
  return {type:'basic',label:'Basic website'};
}
export function creationQuotaForPlan(plan='free',type='basic'){return getPlan(plan).creationLimits?.[type]??0;}
export function canStartCreation({plan='free',type='basic',used=0,isExisting=false}={}) {
  const p=getPlan(plan),limit=creationQuotaForPlan(plan,type);
  return {ok:isExisting||Number(limit)>Number(used||0),plan:p.id,type,limit,used:Number(used||0),remaining:isExisting?Math.max(0,Number(limit)-Number(used||0)):Math.max(0,Number(limit)-Number(used||0)-1)};
}

export function canStartRun({ plan='free', runs, tokens }) {
  const p = getPlan(plan);
  if(p.monthlyRuns==null||p.monthlyTokens==null)return {ok:true,plan:p.id,runsRemaining:Infinity,tokensRemaining:Infinity};
  return { ok: runs < p.monthlyRuns && tokens < p.monthlyTokens, plan: p.id, runsRemaining: Math.max(0,p.monthlyRuns-runs), tokensRemaining: Math.max(0,p.monthlyTokens-tokens) };
}
export { hasFeature, featureGate };
