import {featureCatalog,hasFeature,featureGate} from './features.js';

export const PLANS = {
  free: {
    id: 'free',
    label: 'Free',
    priceUsd: 0,
    monthlyRuns: 5,
    monthlyTokens: 250000,
    websiteQuotas: { basic: 3, threeD: 1, animated: 1 },
    nativeApps: false,
    priceEnv: null,
    paddlePriceEnv: null,
    features: ['basic_site','visual_builder','basic_seo','ai_chips','annotation_mode','app_gallery','github_import_export','multimodal_prompt','verified_preview'],
    videoTrialSeconds: Number(process.env.CODINGVIBES_VIDEO_TRIAL_SECONDS || 5),
    videoSeconds: 0,
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    priceUsd: 12,
    annualPriceUsd: 120,
    monthlyRuns: 100,
    monthlyTokens: 8000000,
    websiteQuotas: { basic: 100, threeD: 20, animated: 20 },
    nativeApps: true,
    priceEnv: 'STRIPE_PRICE_PRO_MONTHLY',
    paddlePriceEnv: 'PADDLE_PRICE_PRO_MONTHLY',
    features: ['basic_site','visual_builder','basic_seo','advanced_animation','ai_video','advanced_seo','deployment','private_projects','custom_domain','native_apps','team_collaboration','audit_export','scaleout','ai_chips','annotation_mode','app_gallery','github_import_export','multimodal_prompt','verified_preview'],
    videoTrialSeconds: 0,
    videoSeconds: Number(process.env.CODINGVIBES_PRO_VIDEO_SECONDS || 120),
  },
  team: {
    id: 'team',
    label: 'Team',
    priceUsd: 29,
    annualPriceUsd: 290,
    monthlyRuns: 1000,
    monthlyTokens: 25000000,
    websiteQuotas: { basic: 500, threeD: 100, animated: 100 },
    nativeApps: true,
    priceEnv: 'STRIPE_PRICE_TEAM_MONTHLY',
    paddlePriceEnv: 'PADDLE_PRICE_TEAM_MONTHLY',
    features: ['basic_site','visual_builder','basic_seo','advanced_animation','ai_video','advanced_seo','deployment','private_projects','custom_domain','native_apps','team_collaboration','audit_export','scaleout','ai_chips','annotation_mode','app_gallery','github_import_export','multimodal_prompt','verified_preview'],
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
    paddlePriceConfigured: Boolean(p.paddlePriceEnv && env[p.paddlePriceEnv]),
    featureCatalog: featureCatalog(),
  }));
}
export function canStartRun({ plan='free', runs, tokens }) {
  const p = getPlan(plan);
  return { ok: runs < p.monthlyRuns && tokens < p.monthlyTokens, plan: p.id, runsRemaining: Math.max(0,p.monthlyRuns-runs), tokensRemaining: Math.max(0,p.monthlyTokens-tokens) };
}
export { hasFeature, featureGate };
