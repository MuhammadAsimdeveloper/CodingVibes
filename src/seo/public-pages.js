import {organizationSchema,websiteSchema,softwareApplicationSchema,breadcrumbSchema,jsonLdGraph,cleanTitle,cleanDescription,absoluteUrl,PUBLIC_ROBOTS} from './metadata.js';

const BASE_NAV=[['Features','/features'],['Templates','/templates'],['Pricing','/pricing'],['How it works','/how-it-works'],['FAQ','/faq']];
const COMMON_CTA='<div class="seo-cta"><a class="seo-btn primary" href="/app">Start building free</a><a class="seo-btn secondary" href="/templates">Explore templates</a></div>';

const PAGES={
  '/features':{
    title:'Build Vibe Features: AI Builder, Design Mode & Verification',
    description:'Explore Build Vibe features for AI product generation, visual editing, content management, verification, deployment, SEO and mobile targets.',
    eyebrow:'PRODUCT FEATURES',
    intro:'Build Vibe combines product planning, visual generation, structured content, verification and publishing in one workflow.',
    sections:[
      ['Prompt-to-product','Describe a website, SaaS product, store, dashboard or mobile experience in natural language. Build Vibe turns the request into a structured product model before generation, so the build has explicit pages, data, behavior and target requirements.'],
      ['Design Mode','Change the visual direction as a system instead of patching isolated styles. Design Mode keeps typography, color, spacing, radii, elevation, motion and responsive behavior coherent as a product evolves.'],
      ['Content & data','Keep products, services, articles, properties, courses and other records separate from presentation. Owner-managed content can be revised without recreating the whole visual layer.'],
      ['Verify before ship','Generated changes pass source checks, application tests and HTTP/browser verification when configured. Native targets remain verification-gated so source code is not mislabeled as a verified binary.'],
      ['Publish and export','Push verified source to GitHub or use compatible deployment adapters and portable ZIP export. The goal is to keep the source tree portable rather than lock the customer into one hosting destination.'],
      ['SEO and AI-search readiness','Generated public pages receive page-specific metadata, canonical URLs, social previews, structured data and crawl controls. Build Vibe also produces a supplemental llms.txt for machine-readable orientation while keeping normal SEO fundamentals primary.']
    ],
    extraLinks:[['AI website builder','/ai-website-builder'],['AI app builder','/ai-app-builder'],['Mobile app builder','/mobile-app-builder'],['Ecommerce builder','/ecommerce-website-builder']]
  },
  '/templates':{
    title:'AI Website & App Templates | Build Vibe',
    description:'Browse Build Vibe templates for business, ecommerce, SaaS, real estate, portfolios, education, events, communities, documentation and more.',
    eyebrow:'TEMPLATE STUDIO',
    intro:'Start from a strong product pattern, then replace the template assumptions with your own requirements, content and design direction.',
    sections:[
      ['Business and professional services','Consulting, law, construction, local services and operational sites give service businesses a practical starting point for trust, lead capture, locations, FAQs and contact flows.'],
      ['Commerce and marketplaces','Use commerce-oriented foundations for catalogs, product detail, variants, inventory, carts, checkout CTAs, vendors, filters and owner-managed content.'],
      ['Real estate and hospitality','Property and hospitality recipes support listings, room or property records, booking-oriented flows, locations, galleries and optional 3D experiences.'],
      ['SaaS, education and communities','Build product-led marketing sites, dashboards, course catalogs, community surfaces, documentation and knowledge-base experiences from structured requirements.'],
      ['Motion and immersive experiences','Selected templates include motion-first and 3D patterns for editorial storytelling, product showcases, property tours and premium brand experiences. Progressive fallbacks keep critical information available when heavy effects are unavailable.']
    ],
    extraLinks:[['AI website builder','/ai-website-builder'],['3D website builder','/3d-website-builder'],['SaaS app builder','/saas-app-builder'],['Ecommerce website builder','/ecommerce-website-builder']]
  },
  '/pricing':{
    title:'Build Vibe Pricing | Free, Pro, Team & Business',
    description:'See Build Vibe pricing for Free, Pro, Team and Business plans, including exact free website entitlements, 3D, animation, APK access, deployment and collaboration.',
    eyebrow:'PRICING',
    intro:'Build Vibe keeps the first product experiences accessible, then scales AI, 3D, native app and collaboration capacity as your needs grow.',
    sections:[
      ['Free — $0/month','Each Free account can create 3 basic websites, 1 animated website and 1 3D website. Native Android/APK creation is not available on Free. Assistant chat, project history, design mode, preview and verification remain part of the free experience.'],
      ['Pro — $7/month','Pro adds 25 basic, 25 animated, 10 3D and 10 APK/native-app creations per account, plus higher AI capacity, advanced SEO, AI video, deployment and custom domains.'],
      ['Team — $15/month','Team adds 100 basic, 100 animated, 50 3D and 40 APK/native-app creations per account, plus workspace roles, approvals, audit and higher collaborative capacity.'],
      ['Business — $39/month','Business is designed for agencies and growing teams with 500 basic, 500 animated, 200 3D and 100 APK/native-app creations per account plus higher AI capacity and scale-out controls.'],
      ['Usage and infrastructure','Plans control Build Vibe entitlements and application capacity. Model inference, browser verification, 3D/video providers and external hosting can have their own provider-specific limits and costs.'],
      ['Verified output','Every plan keeps the same product principle: generated work must remain inspectable and pass the configured verification/review path before an explicit commit or deployment.']
    ],
    extraLinks:[['Features','/features'],['How it works','/how-it-works'],['FAQ','/faq']]
  },
  '/ai-website-builder':{
    title:'AI Website Builder for Custom, Verified Websites | Build Vibe',
    description:'Build websites from natural-language requirements with AI planning, visual design, structured content, verification, SEO metadata and portable publishing.',
    eyebrow:'AI WEBSITE BUILDER',
    intro:'Build Vibe is an AI website builder for people who want more than a screenshot or a disposable prototype: generate a real, inspectable website and keep iterating on it.',
    sections:[
      ['Describe the outcome','Start with the business, audience, pages, content, interactions and visual style you actually need. The requirements layer turns that description into a target-aware product contract.'],
      ['Generate a complete site shape','Build Vibe can produce landing sites, business pages, ecommerce storefronts, portfolios, property experiences, blogs, documentation and more. Generated sites use structured content so the important records are not trapped inside design markup.'],
      ['Make design changes systematically','Use Design Mode to steer color, typography, spacing, motion and responsive behavior. This is useful when a product needs brand consistency across many sections instead of a one-off visual patch.'],
      ['Verify before publishing','Source checks and application verification run before the system treats a change as ready. Browser verification can inspect rendered pages when the environment supports it.'],
      ['Ship without losing portability','Verified source can be exported or sent through compatible deployment adapters. The resulting site remains a normal project rather than a closed proprietary runtime.']
    ],
    extraLinks:[['AI app builder','/ai-app-builder'],['Mobile app builder','/mobile-app-builder'],['SEO features','/features'],['Templates','/templates']]
  },
  '/ai-app-builder':{
    title:'AI App Builder for Web Apps & SaaS | Build Vibe',
    description:'Create SaaS products, dashboards, portals and web apps with AI planning, data models, authentication, admin controls and verification.',
    eyebrow:'AI APP BUILDER',
    intro:'Use Build Vibe to turn a product idea into a structured web application with pages, data, workflows, authentication choices, owner controls and a verification path.',
    sections:[
      ['From prompt to product model','Describe users, workflows, data entities, roles, payments and integrations. Build Vibe creates a product blueprint before generating the application shape.'],
      ['Web apps and SaaS','Generate customer portals, operational dashboards, marketplaces, CMS-driven products and SaaS marketing plus application surfaces. The builder treats the product as a connected system rather than a collection of mock screens.'],
      ['Authentication and admin','Every generated website includes an owner-only /admin surface. Public login is opt-in, and Google login is supported when requested. This keeps owner management distinct from public authentication.'],
      ['Data-driven content','Products, services, posts, properties and other records live in a separate content model. This makes ongoing editing possible without replacing the visual layer.'],
      ['Verification and export','The system validates generated application contracts and runtime behavior before commit. Source remains portable for GitHub, ZIP export and compatible deployment providers.']
    ],
    extraLinks:[['SaaS app builder','/saas-app-builder'],['Ecommerce website builder','/ecommerce-website-builder'],['Features','/features']]
  },
  '/mobile-app-builder':{
    title:'AI Mobile App Builder for Android & iOS | Build Vibe',
    description:'Plan and generate mobile product foundations for Android and iOS with target-aware contracts, native runners and verification-gated artifacts.',
    eyebrow:'MOBILE APP BUILDER',
    intro:'Build Vibe treats mobile as a product target with its own contracts and toolchains instead of claiming that generated source code is automatically a verified app binary.',
    sections:[
      ['Choose the target','The planner supports mobile-oriented targets including Expo/React Native, Flutter, native Android/Kotlin and SwiftUI, alongside PWA and desktop targets.'],
      ['Keep requirements explicit','Authentication, navigation, data, notifications, payments and responsive product behavior are captured as requirements instead of being inferred only from visual layout.'],
      ['Use real toolchains for verification','Android, Flutter, Rust/Tauri and Apple builds require the appropriate isolated runner and SDK environment. A source tree alone does not count as a verified binary.'],
      ['Export and continue','Generated projects remain portable. Teams can inspect the source, continue development in GitHub and connect deployment or signing infrastructure appropriate to their target.']
    ],
    extraLinks:[['AI app builder','/ai-app-builder'],['Features','/features'],['How it works','/how-it-works']]
  },
  '/ecommerce-website-builder':{
    title:'AI Ecommerce Website Builder | Build Vibe',
    description:'Build ecommerce websites with product catalogs, collections, variants, cart flows, owner-managed content, responsive design and SEO foundations.',
    eyebrow:'ECOMMERCE BUILDER',
    intro:'Build Vibe provides an ecommerce-oriented product model so stores can evolve from a visual starter into a content-driven customer experience.',
    sections:[
      ['Catalog-first structure','Products, collections, variants and inventory are represented as structured records. This allows content to be edited without hardcoding every item into a page.'],
      ['Conversion-ready flows','Commerce templates support product grids, product detail patterns, cart interactions, checkout calls to action, reviews and promotional sections.'],
      ['Owner-managed content','Every generated site has an owner-only admin portal, so store operators have a dedicated control surface for content and settings.'],
      ['Search and discoverability','Product pages can carry clear titles, descriptions, canonical URLs, social metadata and structured data. Search visibility still depends on real product information, useful content, site authority and technical accessibility.'],
      ['Payment safety','Payment flows are server-mediated and provider-backed. The platform does not claim a real transaction has been verified unless the configured payment provider actually completes the test.']
    ],
    extraLinks:[['AI website builder','/ai-website-builder'],['Templates','/templates'],['Pricing','/pricing']]
  },
  '/saas-app-builder':{
    title:'AI SaaS App Builder | Build Vibe',
    description:'Create SaaS websites and application foundations with teams, roles, subscriptions, dashboards, content, integrations and verification.',
    eyebrow:'SAAS APP BUILDER',
    intro:'Build Vibe is designed for SaaS products that need both a convincing public site and a functional application foundation.',
    sections:[
      ['Plan the full product','Describe the public marketing surface, authenticated application, users, roles, data and workflows together so the generated plan can preserve the relationships between them.'],
      ['Teams and permissions','Workspaces support owner, admin, editor, reviewer and viewer roles for collaborative product development, with approvals and audit visibility.'],
      ['Billing and integrations','The platform includes billing plan definitions and Stripe integration boundaries, plus connectors for external services. Live provider behavior still depends on real credentials and environments.'],
      ['Design and content','Keep product UX coherent with Design Mode and manage structured content without rebuilding the presentation layer.'],
      ['Verify before ship','SaaS projects can pass source, HTTP/browser and other configured checks before an explicit verified commit and deployment.']
    ],
    extraLinks:[['AI app builder','/ai-app-builder'],['Features','/features'],['Pricing','/pricing']]
  },
  '/3d-website-builder':{
    title:'AI 3D Website Builder for Interactive Experiences | Build Vibe',
    description:'Create immersive 3D websites for products, property, architecture, hospitality and storytelling with progressive fallbacks and verified output.',
    eyebrow:'3D WEBSITE BUILDER',
    intro:'Build Vibe supports 3D as an experience layer on top of useful page content, so interactive scenes enhance the product rather than replacing essential information.',
    sections:[
      ['Product and property experiences','Generate immersive patterns for product showcases, real estate tours, architecture, hospitality, portfolios and editorial storytelling.'],
      ['Progressive enhancement','3D scenes include content-preserving fallbacks so critical text and navigation remain useful when WebGL, heavy assets or device capabilities are limited.'],
      ['Structured media','Models, videos, images, hotspots and scene records can be stored as content references instead of disappearing into a single page component.'],
      ['Performance-aware motion','Animations honor reduced-motion preferences, and heavier experiences should be treated as enhancement rather than as the only way to communicate information.'],
      ['Verification','Visual and runtime checks can validate the non-3D page contract, while native or special runtime verification remains dependent on the relevant toolchain.']
    ],
    extraLinks:[['Templates','/templates'],['AI website builder','/ai-website-builder'],['Features','/features']]
  },
  '/how-it-works':{
    title:'How Build Vibe Works | Describe, Build, Verify, Ship',
    description:'See how Build Vibe turns natural-language product requirements into structured, verified and portable websites and apps.',
    eyebrow:'HOW IT WORKS',
    intro:'Build Vibe is organized around a repeatable product loop: understand the request, generate the right shape, verify it, then publish what passed.',
    sections:[
      ['1. Describe','Explain the product in natural language. Include pages, users, data, workflows, integrations, payments, visual style and target platforms when they matter.'],
      ['2. Plan','The platform builds a structured product blueprint with target-aware requirements, content models, behavior and design intent.'],
      ['3. Generate','The builder creates a project shape with public pages, application behavior, editable content and the required owner admin surface.'],
      ['4. Verify','Source checks, tests, HTTP/browser checks and bounded repair help catch failures before commit. Native outputs require their real isolated toolchains.'],
      ['5. Review and publish','Inspect the changes and evidence, explicitly commit verified work, then export or publish through a compatible deployment path.'],
      ['6. Refine','Return to the project, change the requirements or content, and repeat the loop without rebuilding from zero.']
    ],
    extraLinks:[['AI website builder','/ai-website-builder'],['AI app builder','/ai-app-builder'],['Pricing','/pricing']]
  },
  '/faq':{
    title:'Build Vibe FAQ | AI Website & App Builder',
    description:'Answers about Build Vibe, generated websites, mobile apps, admin portals, Google login, verification, pricing, hosting and SEO.',
    eyebrow:'FAQ',
    intro:'Clear answers to the most common questions about using Build Vibe to create and ship websites and applications.',
    faqs:[
      ['What is Build Vibe?','Build Vibe is an AI product builder that turns natural-language requirements into websites, web applications and mobile product foundations, with design, content, verification and publishing workflows.'],
      ['Does every generated website have an admin portal?','Yes. Every generated website includes an owner-only /admin surface. A public login page is generated only when the product requirements request public authentication.'],
      ['Can Build Vibe create mobile apps?','It can generate target-aware mobile project foundations and supports targets such as Expo/React Native, Flutter, Android/Kotlin and SwiftUI. Real binary verification still requires the corresponding SDK and isolated runner.'],
      ['Can I export the source code?','Yes. The platform is designed around portable source and supports GitHub synchronization and verified ZIP export, with compatible deployment adapters.'],
      ['Does Build Vibe guarantee Google rankings?','No. Technical SEO improves crawlability and understanding, but Google does not guarantee indexing or rankings. Useful content, authority, links, page experience and query relevance still matter.'],
      ['Does Build Vibe use AI-generated SEO pages?','The platform can assist with content generation, but its SEO system is designed to require useful, product-relevant information rather than mass-producing thin keyword pages.'],
      ['Can I deploy to Hostinger or other providers?','The platform includes provider-aware deployment and export boundaries, but live deployment depends on the provider, credentials, project type and environment configured for that deployment.']
    ]
  }
};

function esc(value){return String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');}
function schemaFor(path,page,baseUrl){
  const base=baseUrl||'__SITE_URL__';
  const nodes=[organizationSchema(base),websiteSchema(base,'Build Vibe','AI website and app builder'),{'@type':'WebPage','@id':absoluteUrl(base,path)+'#webpage',url:absoluteUrl(base,path),name:page.title,description:page.description,inLanguage:'en',isPartOf:{'@id':absoluteUrl(base,'/')+'#website'},about:{'@id':absoluteUrl(base,'/')+'#organization'}}];
  if(['/', '/features','/ai-website-builder','/ai-app-builder','/mobile-app-builder','/ecommerce-website-builder','/saas-app-builder','/3d-website-builder'].includes(path))nodes.push(softwareApplicationSchema(base));
  const crumbs=[{name:'Build Vibe',path:'/'},{name:page.title,path}];
  nodes.push(breadcrumbSchema(base,crumbs));
  if(path==='/faq'){
    nodes.push({'@type':'FAQPage','@id':absoluteUrl(base,path)+'#faqpage','mainEntity':page.faqs.map(([question,answer])=>({'@type':'Question','name':question,'acceptedAnswer':{'@type':'Answer','text':answer}}))});
  }
  return jsonLdGraph(nodes);
}
export function listPublicSeoPages(){return Object.entries(PAGES).map(([path,page])=>({path,...page}));}
export function renderPublicSeoPage(path,{baseUrl='__SITE_URL__'}={}){
  const page=PAGES[path];if(!page) return null;
  const title=cleanTitle(page.title),description=cleanDescription(page.description);
  const bodySections=page.sections||[];
  const faqs=page.faqs||[];
  const links=(page.extraLinks||[]).map(([label,href])=>'<a href="'+esc(href)+'">'+esc(label)+'</a>').join(' · ');
  const faqHtml=faqs.length?'<section><h2>Frequently asked questions</h2>'+faqs.map(([q,a])=>'<details class="seo-card"><summary><strong>'+esc(q)+'</strong></summary><p>'+esc(a)+'</p></details>').join('')+'</section>':'';
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(title)+'</title><meta name="description" content="'+esc(description)+'"><meta name="robots" content="'+PUBLIC_ROBOTS+'"><meta name="theme-color" content="#050816"><meta name="application-name" content="Build Vibe"><meta name="author" content="Build Vibe"><link rel="icon" href="/favicon.svg"><link rel="manifest" href="/site.webmanifest"><link rel="canonical" href="'+esc(absoluteUrl(baseUrl,path))+'"><meta property="og:type" content="website"><meta property="og:site_name" content="Build Vibe"><meta property="og:title" content="'+esc(title)+'"><meta property="og:description" content="'+esc(description)+'"><meta property="og:url" content="'+esc(absoluteUrl(baseUrl,path))+'"><meta property="og:image" content="'+esc(absoluteUrl(baseUrl,'/og-image.svg'))+'"><meta property="og:image:alt" content="'+esc(title)+' preview"><meta property="og:image:type" content="image/svg+xml"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="'+esc(title)+'"><meta name="twitter:description" content="'+esc(description)+'"><meta name="twitter:image" content="'+esc(absoluteUrl(baseUrl,'/og-image.svg'))+'"><meta name="twitter:image:alt" content="'+esc(title)+' preview"><script type="application/ld+json">'+schemaFor(path,page,baseUrl)+'</script><link rel="stylesheet" href="/seo.css"></head><body class="seo-page"><div class="seo-wrap"><nav class="seo-nav"><a class="seo-brand" href="/">Build Vibe</a>'+BASE_NAV.map(([label,href])=>'<a href="'+href+'">'+label+'</a>').join('')+'</nav><div class="seo-crumb">Build Vibe / '+esc(page.eyebrow||'Page')+'</div><main><section class="seo-hero-grid"><div class="seo-hero"><div class="seo-crumb">'+esc(page.eyebrow||'BUILD VIBE')+'</div><h1>'+esc(title)+'</h1><p>'+esc(page.intro)+'</p>'+COMMON_CTA+'</section>'+bodySections.map(([heading,text])=>'<section><h2>'+esc(heading)+'</h2><p>'+esc(text)+'</p></section>').join('')+faqHtml+(links?'<section><h2>Related Build Vibe guides</h2><p>'+links+'</p></section>':'')+'</main><footer class="seo-footer">© 2026 Build Vibe · <a href="/terms">Terms</a> · <a href="/privacy">Privacy</a></footer></div></body></html>';
}
