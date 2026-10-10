export const DESIGN_GUIDANCE_SOURCE=Object.freeze({
  repository:'nextlevelbuilder/ui-ux-pro-max-skill',
  commit:'50d8a7de0900119855614541f15a1a616691eb33',
  release:'v2.15.0',
  license:'MIT',
  reviewedAt:'2026-10-10',
  version:'building-vibe-design-guidance.v1'
});

const BASE_RULES=[
  'Use semantic structure and responsive layouts',
  'Respect reduced-motion preferences',
  'Never invent metrics, testimonials or customer identities',
  'Provide explicit loading, empty, error and success states',
  'No purple gradients',
  'No fabricated customer proof',
  'No cursor-following effects',
  'No excessive scroll-linked animation',
  'No pill-shaped buttons',
  'Never show Made with AI attribution on published user products',
  'Never use emoji as interface icons',
  'Avoid vague filler copy and em-dash punctuation',
  'Never publish template placeholder copy or owner instructions',
  'Use only authentic, licensed, or clearly identified illustrative assets',
  'Do not use random placeholder-photo endpoints or synthetic people presented as real customers',
  'Preserve keyboard access, visible focus and accessible names',
  'Keep essential content available without animation'
];

const STYLE_RULES={
  modern:['Use a restrained palette with one clear accent and readable contrast','Use an 8px-based spacing rhythm and consistent component radii'],
  minimal:['Prioritize whitespace, typography and content hierarchy over decoration','Use borders and shadows sparingly'],
  editorial:['Use deliberate typography hierarchy and a readable measure for long-form content','Keep navigation and actions obvious even when layouts are asymmetric'],
  brutalist:['Use strong contrast and explicit hierarchy without sacrificing keyboard focus or readability','Keep geometry intentional and avoid decorative motion'],
  luxury:['Use restrained accents, precise spacing and high-quality typography','Avoid ornamental gradients and unsupported exclusivity claims'],
  futuristic:['Use technical clarity, controlled contrast and purposeful data visualization','Keep glow, blur and 3D effects limited to elements that improve comprehension'],
  playful:['Use a clear grid and friendly color roles without turning controls into toys','Keep movement short, non-looping and subordinate to the task'],
  bold:['Use a strong type scale and a small number of confident accent colors','Make primary actions clear without making every element compete'],
  glass:['Maintain contrast over translucent surfaces and provide an opaque fallback','Do not use blur or transparency as the only way to communicate hierarchy'],
  retro:['Use a coherent era-inspired type and color system with modern accessibility','Keep nostalgic decoration separate from navigation and critical actions']
};

const PRODUCT_RULES={
  website:['Give each page a clear purpose and one visually dominant primary action'],
  business:['Make services, service area, contact method and next steps explicit','Use real business details only when supplied'],
  saas:['Explain the product capability and intended user in concrete terms','Show pricing, integrations and performance claims only when configured or supplied'],
  ecommerce:['Show accurate product details, prices, availability and checkout states','Never invent reviews, ratings, stock levels, discounts or scarcity'],
  portfolio:['Show only projects, clients, roles and outcomes supplied by the owner','Use project context and work samples instead of fabricated testimonials'],
  dashboard:['Label the source and time range of data; use clearly labeled demo data when no live source exists','Provide empty, loading, error and permission-denied states for data views'],
  '3d-showcase':['Provide a non-WebGL fallback','Keep 3D camera movement user-controlled','Use a static poster or useful product details while 3D assets load','Do not tie essential content or camera navigation to scrolling'],
  'mobile-app':['Use touch targets of comfortable size and respect safe areas','Make navigation, permissions and offline/error states clear']
};

const STACK_RULES={
  web:['Use semantic HTML and native controls before custom widgets','Keep generated routes, assets and core interactions usable without a remote script'],
  'web-node':['Use semantic HTML, responsive CSS and progressive enhancement','Keep server secrets out of public files and generated client bundles'],
  'web-pwa':['Include a valid app icon and manifest when PWA output is requested','Describe offline behavior accurately and avoid caching private responses'],
  'mobile-app':['Respect platform navigation, safe areas, accessibility labels and system text scaling','Request permissions only when the user invokes the relevant feature'],
  '3d-web':['Load 3D assets progressively and provide a static fallback on unsupported devices','Support keyboard-accessible controls and reduced-motion behavior']
};

function normalizeStyle(value){
  const style=String(value||'modern').trim().toLowerCase().replace(/\s+/g,'-');
  return Object.hasOwn(STYLE_RULES,style)?style:'modern';
}
function normalizeProductType(value){
  const text=String(value||'website').trim().toLowerCase();
  if(/3d|immersive|showcase|webgl|model/.test(text))return '3d-showcase';
  if(/ecommerce|marketplace|shop|store/.test(text))return 'ecommerce';
  if(/saas|software|subscription/.test(text))return 'saas';
  if(/portfolio|agency|studio|creator/.test(text))return 'portfolio';
  if(/dashboard|admin|analytics/.test(text))return 'dashboard';
  if(/mobile|native|expo|flutter|ios|android/.test(text))return 'mobile-app';
  if(/business|local|service/.test(text))return 'business';
  return 'website';
}
function normalizeStack(value){
  const text=String(value||'web').trim().toLowerCase();
  if(/three|webgl|3d/.test(text))return '3d-web';
  if(/mobile|native|expo|flutter|ios|android/.test(text))return 'mobile-app';
  if(/pwa/.test(text))return 'web-pwa';
  if(/node|react|next|html|web/.test(text))return 'web-node';
  return 'web';
}

export function getDesignGuidance({productType='website',style='modern',stack='web',intent=''}={}){
  const normalizedProduct=normalizeProductType(productType);
  const normalizedStyle=normalizeStyle(style);
  const normalizedStack=normalizeStack(stack);
  const rules=[...BASE_RULES,...(STYLE_RULES[normalizedStyle]||[]),...(PRODUCT_RULES[normalizedProduct]||PRODUCT_RULES.website),...(STACK_RULES[normalizedStack]||STACK_RULES.web)];
  if(/booking|appointment|reservation/i.test(String(intent)))rules.push('Show availability, timezone and confirmation/error states without inventing bookings');
  if(/payment|checkout|subscription/i.test(String(intent)))rules.push('Do not claim payment processing is live unless a real provider is configured and verified');
  if(/seo|search engine|organic search/i.test(String(intent)))rules.push('Use unique page titles, accurate descriptions, canonical URLs and valid crawl directives');
  return {
    version:DESIGN_GUIDANCE_SOURCE.version,
    source:{...DESIGN_GUIDANCE_SOURCE},
    productType:normalizedProduct,
    style:normalizedStyle,
    stack:normalizedStack,
    rules:[...new Set(rules)]
  };
}

export function renderDesignGuidance(guidance){
  const value=guidance&&Array.isArray(guidance.rules)?guidance:getDesignGuidance();
  return [
    'Design guidance version '+value.version+' (curated local snapshot; pinned upstream commit '+value.source.commit+'; '+value.source.license+' license).',
    'Product type: '+value.productType+'. Style: '+value.style+'. Stack: '+value.stack+'.',
    ...value.rules.map(rule=>'- '+rule)
  ].join('\n');
}
