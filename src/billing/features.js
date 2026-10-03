const FEATURE_RULES = {
  basic_site: { label: 'Basic website generation', minPlan: 'free' },
  code_editor: { label: 'Free code editor', minPlan: 'free' },
  basic_seo: { label: 'Core SEO markup', minPlan: 'free' },
  advanced_animation: { label: 'Advanced motion / 3D', minPlan: 'pro' },
  ai_video: { label: 'AI video generation', minPlan: 'pro' },
  advanced_seo: { label: 'Advanced SEO automation', minPlan: 'pro' },
  deployment: { label: 'One-click deployment', minPlan: 'pro' },
  private_projects: { label: 'Private projects', minPlan: 'pro' },
  custom_domain: { label: 'Custom domains', minPlan: 'pro' },
};

const PLAN_ORDER = { free: 0, pro: 1, team: 2 };

export function featureCatalog() {
  return Object.entries(FEATURE_RULES).map(([id, rule]) => ({ id, ...rule }));
}

export function hasFeature(plan = 'free', feature) {
  const required = FEATURE_RULES[feature]?.minPlan || 'free';
  return (PLAN_ORDER[plan] ?? 0) >= (PLAN_ORDER[required] ?? 0);
}

export function classifyRequest(request = '') {
  const text = String(request).toLowerCase();
  const features = new Set(['basic_site']);
  if (/(^|\W)(3d|3-d|webgl|three\.js|threejs|babylon|spline|immersive|shader|particle|particles)(\W|$)/.test(text) ||
      /(gsap|scrolltrigger|lottie|rive|parallax|smooth scroll|advanced animation|motion design)/.test(text)) {
    features.add('advanced_animation');
  }
  if (/(ai video|generate video|text[- ]to[- ]video|image[- ]to[- ]video|video generator|make a video)/.test(text)) {
    features.add('ai_video');
  }
  if (/(seo audit|schema automation|programmatic seo|keyword research|content cluster|search console integration)/.test(text)) {
    features.add('advanced_seo');
  }
  if (/(deploy|publish|host it|hosting|custom domain|cloudflare|hostinger|production url)/.test(text)) {
    features.add('deployment');
  }
  if (/(private project|private workspace|team workspace)/.test(text)) {
    features.add('private_projects');
  }
  if (/(custom domain|domain)/.test(text)) {
    features.add('custom_domain');
  }
  return [...features];
}

export function firstBlockedFeature(plan = 'free', request = '') {
  for (const feature of classifyRequest(request)) {
    if (!hasFeature(plan, feature)) return feature;
  }
  return null;
}

export function featureGate(plan = 'free', request = '') {
  const requested = classifyRequest(request);
  const blocked = requested.filter(feature => !hasFeature(plan, feature));
  return {
    ok: blocked.length === 0,
    requested,
    blocked,
    requiredPlans: blocked.map(feature => ({ feature, minPlan: FEATURE_RULES[feature]?.minPlan || 'pro', label: FEATURE_RULES[feature]?.label || feature })),
  };
}
