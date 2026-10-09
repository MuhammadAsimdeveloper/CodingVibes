const FEATURE_RULES = {
  basic_site: { label: 'Basic website generation', minPlan: 'free' },
  visual_builder: { label: 'Visual product builder', minPlan: 'free' },
  basic_seo: { label: 'Core SEO markup', minPlan: 'free' },
  ai_chips: { label: 'Build-mode AI chips', minPlan: 'free' },
  annotation_mode: { label: 'Visual annotation mode', minPlan: 'free' },
  app_gallery: { label: 'App gallery and remixable starters', minPlan: 'free' },
  github_import_export: { label: 'GitHub import/export workflow', minPlan: 'free' },
  multimodal_prompt: { label: 'Multimodal prompt context', minPlan: 'free' },
  verified_preview: { label: 'Verified preview/build checks', minPlan: 'free' },
  animated_site: { label: 'One animated-site build allowance', minPlan: 'free' },
  three_d_site: { label: 'One 3D/immersive build allowance', minPlan: 'free' },
  advanced_animation: { label: 'Advanced motion / 3D', minPlan: 'pro' },
  ai_video: { label: 'AI video generation', minPlan: 'pro' },
  advanced_seo: { label: 'Advanced SEO automation', minPlan: 'pro' },
  deployment: { label: 'One-click deployment', minPlan: 'pro' },
  private_projects: { label: 'Private projects', minPlan: 'pro' },
  custom_domain: { label: 'Custom domains', minPlan: 'pro' },
  native_apps: { label: 'Native app / APK build pipeline', minPlan: 'pro' },
  team_collaboration: { label: 'Team collaboration controls', minPlan: 'team' },
  audit_export: { label: 'Audit and release evidence export', minPlan: 'team' },
  scaleout: { label: 'Production scale-out controls', minPlan: 'team' },
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
      /(virtual tour|3d viewer|3d product|3d experience)/.test(text)) {
    features.add('three_d_site');
  }
  if (/(animated|animation|motion design|microinteraction|scroll reveal|parallax)/.test(text)) {
    features.add('animated_site');
  }
  if (/(gsap|scrolltrigger|framer motion|advanced animation|cinematic motion|complex animation|lottie|rive)/.test(text)) {
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
  if (/(\bapk\b|\baab\b|native android|android app|kotlin|jetpack compose|react native|flutter app|ios app|swiftui|tauri|electron desktop)/.test(text)) {
    features.add('native_apps');
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
