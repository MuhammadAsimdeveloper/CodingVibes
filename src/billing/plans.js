export const PLANS = {
  free: { id: 'free', label: 'Free', monthlyRuns: 5, monthlyTokens: 250000, priceEnv: null },
  pro: { id: 'pro', label: 'Pro', monthlyRuns: 100, monthlyTokens: 5000000, priceEnv: 'STRIPE_PRICE_PRO_MONTHLY' },
  team: { id: 'team', label: 'Team', monthlyRuns: 1000, monthlyTokens: 25000000, priceEnv: 'STRIPE_PRICE_TEAM_MONTHLY' }
};
export function getPlan(id = 'free') { return PLANS[id] || PLANS.free; }
export function currentPeriodKey(date = new Date()) { return `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}`; }
export function planCatalog(env = process.env) {
  return Object.values(PLANS).map(p => ({ ...p, stripePriceConfigured: Boolean(p.priceEnv && env[p.priceEnv]) }));
}
export function canStartRun({ plan='free', runs, tokens }) {
  const p = getPlan(plan);
  return { ok: runs < p.monthlyRuns && tokens < p.monthlyTokens, plan: p.id, runsRemaining: Math.max(0,p.monthlyRuns-runs), tokensRemaining: Math.max(0,p.monthlyTokens-tokens) };
}
