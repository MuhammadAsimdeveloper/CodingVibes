import {featureCatalog,hasFeature,featureGate} from './features.js';

export const PLANS = {
  free: {
    id: 'free', label: 'Free', monthlyRuns: 5, monthlyTokens: 250000, priceEnv: null,
    features: ['basic_site','visual_builder','basic_seo'],
    videoTrialSeconds: Number(process.env.CODINGVIBES_VIDEO_TRIAL_SECONDS || 5),
    videoSeconds: 0,
  },
  pro: {
    id: 'pro', label: 'Pro', priceUsd: 7, monthlyRuns: 100, monthlyTokens: 5000000, priceEnv: 'STRIPE_PRICE_PRO_MONTHLY',
    features: ['basic_site','visual_builder','basic_seo','advanced_animation','ai_video','advanced_seo','deployment','private_projects','custom_domain'],
    videoTrialSeconds: 0,
    videoSeconds: Number(process.env.CODINGVIBES_PRO_VIDEO_SECONDS || 120),
  },
  team: {
    id: 'team', label: 'Team', priceUsd: 15, monthlyRuns: 1000, monthlyTokens: 25000000, priceEnv: 'STRIPE_PRICE_TEAM_MONTHLY',
    features: ['basic_site','visual_builder','basic_seo','advanced_animation','ai_video','advanced_seo','deployment','private_projects','custom_domain'],
    videoTrialSeconds: 0,
    videoSeconds: Number(process.env.CODINGVIBES_TEAM_VIDEO_SECONDS || 600),
  }
};

export function getPlan(id = 'free') { return PLANS[id] || PLANS.free; }
export function currentPeriodKey(date = new Date()) { return `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}`; }
export function planCatalog(env = process.env) {
  return Object.values(PLANS).map(p => ({
    ...p,
    stripePriceConfigured: Boolean(p.priceEnv && env[p.priceEnv]),
    featureCatalog: featureCatalog(),
  }));
}
export function canStartRun({ plan='free', runs, tokens }) {
  const p = getPlan(plan);
  return { ok: runs < p.monthlyRuns && tokens < p.monthlyTokens, plan: p.id, runsRemaining: Math.max(0,p.monthlyRuns-runs), tokensRemaining: Math.max(0,p.monthlyTokens-tokens) };
}
export { hasFeature, featureGate };
