const TEMPLATES=[
{id:'aurora-saas',label:'Aurora SaaS',category:'SaaS',kind:'business',tier:'free',style:'futuristic',experience:'motion',featured:true,tags:['saas','ai','b2b'],prompt:'Create a polished SaaS landing site with pricing, product benefits, testimonials, FAQ, signup CTA and responsive sections.',features:[]},
{id:'studio-agency',label:'Studio Agency',category:'Agency',kind:'agency',tier:'free',style:'editorial',experience:'motion',featured:true,tags:['agency','portfolio','case studies'],prompt:'Create a premium creative agency site with case studies, services, process, team and contact CTA.',features:[]},
{id:'creator-portfolio',label:'Creator Portfolio',category:'Portfolio',kind:'portfolio',tier:'free',style:'minimal',experience:'motion',featured:true,tags:['portfolio','personal','creative'],prompt:'Create a striking personal portfolio with project grid, about, experience, testimonials and contact.',features:[]},
{id:'fashion-commerce',label:'Fashion Commerce',category:'Commerce',kind:'ecommerce',tier:'free',style:'luxury',experience:'motion',featured:true,tags:['fashion','shop','commerce'],prompt:'Create a luxury fashion ecommerce storefront with product grid, product detail, cart-ready checkout UI, editorial sections and responsive design.',features:[]},
{id:'restaurant',label:'Restaurant & Dining',category:'Business',kind:'hospitality',tier:'free',style:'editorial',experience:'motion',tags:['restaurant','menu','booking'],prompt:'Create an elegant restaurant website with menu, reservations, location, gallery, chef story and mobile-friendly navigation.',features:[]},
{id:'hotel-resort',label:'Hotel & Resort',category:'Hospitality',kind:'hospitality',tier:'free',style:'luxury',experience:'motion',tags:['hotel','resort','booking'],prompt:'Create a premium hotel/resort website with rooms, amenities, gallery, experiences, location and booking CTA.',features:[]},
{id:'real-estate-classic',label:'Real Estate Classic',category:'Real Estate',kind:'realEstate',tier:'free',style:'modern',experience:'motion',tags:['real estate','property','listings'],prompt:'Create a professional real estate website with property search, listing cards, detail pages, agent profiles and lead forms.',features:[]},
{id:'real-estate-3d-tour',label:'Real Estate 3D Tour',category:'Real Estate',kind:'realEstate',tier:'pro',style:'luxury',experience:'3d',featured:true,tags:['real estate','3d','virtual tour','house','property'],prompt:'Create an immersive real estate property showcase with an interactive Three.js 3D house scene, orbit controls, room hotspots, floor-plan overlay, cinematic camera path, property details, gallery, CTA and an embedded video walkthrough. Support a user-supplied GLB/GLTF model and a procedural house fallback. Include a video section that can play MP4/WebM and a lightweight user-initiated browser recording control.',features:['advanced_animation']},
{id:'property-development',label:'Property Development 3D',category:'Real Estate',kind:'realEstate',tier:'pro',style:'futuristic',experience:'3d',featured:true,tags:['development','3d masterplan','map','real estate'],prompt:'Create an interactive property-development landing site with a 3D masterplan, clickable plot markers, project phases, unit detail drawer, amenities and animated camera transitions.',features:['advanced_animation']},
{id:'architecture-immersive',label:'Architecture Immersive',category:'3D',kind:'agency',tier:'pro',style:'editorial',experience:'3d',featured:true,tags:['architecture','3d','portfolio'],prompt:'Create an architecture studio website with a cinematic 3D scene, camera choreography, material cards, project storytelling, scroll-driven transitions and reduced-motion fallback.',features:['advanced_animation']},
{id:'product-3d-launch',label:'3D Product Launch',category:'3D',kind:'ecommerce',tier:'pro',style:'minimal',experience:'3d',featured:true,tags:['product','3d','launch'],prompt:'Create a product launch website with an interactive 3D product viewer, rotate/zoom interactions, feature callouts, specification tabs, animated storytelling and conversion CTA.',features:['advanced_animation']},
{id:'automotive-showcase',label:'Automotive Showcase',category:'3D',kind:'business',tier:'pro',style:'futuristic',experience:'3d',tags:['car','automotive','3d'],prompt:'Create a cinematic automotive website with an interactive 3D vehicle, orbit camera, paint/material switcher, spec cards, scroll storytelling and optional driving video.',features:['advanced_animation']},
{id:'jewelry-atelier',label:'Jewelry Atelier',category:'Commerce',kind:'ecommerce',tier:'pro',style:'luxury',experience:'3d',tags:['jewelry','luxury','3d'],prompt:'Create a luxury jewelry site with a 3D hero object, product storytelling, zoom/rotate interaction, collection pages, editorial imagery and elegant motion.',features:['advanced_animation']},
{id:'tech-event',label:'Tech Event',category:'Event',kind:'event',tier:'free',style:'bold',experience:'motion',tags:['event','conference','schedule'],prompt:'Create a high-energy tech conference site with speakers, schedule, venue, sponsors, registration CTA and responsive layout.',features:[]},
{id:'course-academy',label:'Course Academy',category:'Education',kind:'education',tier:'free',style:'modern',experience:'motion',tags:['education','courses','learning'],prompt:'Create an online learning landing site with course catalog, instructor profiles, outcomes, curriculum and enrollment CTA.',features:[]},
{id:'mobile-app',label:'Mobile App Launch',category:'Product',kind:'business',tier:'free',style:'playful',experience:'motion',tags:['app','mobile','saas'],prompt:'Create a mobile app launch page with app screenshots, feature storytelling, social proof, pricing and download CTA.',features:[]},
{id:'fintech',label:'Fintech Product',category:'Finance',kind:'business',tier:'free',style:'minimal',experience:'motion',tags:['fintech','finance','dashboard'],prompt:'Create a trustworthy fintech marketing site with product overview, security messaging, pricing, feature comparisons and signup CTA.',features:[]},
{id:'cybersecurity',label:'Cybersecurity',category:'Technology',kind:'business',tier:'free',style:'futuristic',experience:'motion',tags:['security','b2b','technology'],prompt:'Create a cybersecurity company site with threat-focused hero, capabilities, integrations, case studies, trust signals and contact CTA.',features:[]},
{id:'nonprofit',label:'Nonprofit Impact',category:'Nonprofit',kind:'business',tier:'free',style:'editorial',experience:'motion',tags:['charity','nonprofit','donations'],prompt:'Create an accessible nonprofit website with mission, impact stories, programs, events and donation CTA.',features:[]},
{id:'photography',label:'Photography',category:'Creative',kind:'portfolio',tier:'free',style:'minimal',experience:'motion',tags:['photography','gallery','portfolio'],prompt:'Create a photographer portfolio with editorial gallery, project stories, about, services and inquiry flow.',features:[]},
{id:'music-artist',label:'Music Artist',category:'Creative',kind:'portfolio',tier:'free',style:'bold',experience:'motion',tags:['music','artist','tour'],prompt:'Create a modern musician website with music embeds, releases, tour dates, videos, merch CTA and mailing list.',features:[]},
{id:'saas-analytics',label:'SaaS Analytics',category:'SaaS',kind:'business',tier:'free',style:'modern',experience:'motion',tags:['analytics','dashboard','b2b'],prompt:'Create a SaaS analytics marketing site with dashboard preview, metrics storytelling, integrations, pricing and signup CTA.',features:[]},
{id:'ai-lab',label:'AI Research Lab',category:'Technology',kind:'immersive',tier:'pro',style:'futuristic',experience:'3d',tags:['ai','research','interactive'],prompt:'Create an experimental AI lab website with interactive motion, visualized research topics, model cards, papers, demos and cinematic transitions.',features:['advanced_animation']},
{id:'immersive-story',label:'Immersive Story',category:'3D',kind:'immersive',tier:'pro',style:'editorial',experience:'3d',featured:true,tags:['storytelling','parallax','3d'],prompt:'Create an immersive editorial story site using scroll-driven camera movement, depth layers, parallax, animated typography and progressive enhancement.',features:['advanced_animation']},
{id:'video-portfolio',label:'Cinematic Video Portfolio',category:'Creative',kind:'portfolio',tier:'pro',style:'luxury',experience:'motion',tags:['video','portfolio','motion'],prompt:'Create a cinematic video portfolio with fullscreen media, reel playback, project case studies, smooth transitions and accessible video controls.',features:['advanced_animation']},
{id:'game-studio',label:'Game Studio',category:'Entertainment',kind:'immersive',tier:'pro',style:'futuristic',experience:'3d',tags:['game','3d','studio'],prompt:'Create a game studio marketing site with interactive 3D hero, game cards, trailers, lore, team and release CTA.',features:['advanced_animation']},
{id:'real-estate-video-tour',label:'Property + AI Video Tour',category:'Real Estate',kind:'realEstate',tier:'pro',style:'luxury',experience:'3d',featured:true,tags:['real estate','video','3d','ai video'],prompt:'Create a luxury property site combining an interactive 3D home tour, cinematic camera path, floor plan, room hotspots, photo gallery and an AI-video-tour area with clear loading/error states.',features:['advanced_animation','ai_video']},

{id:'shopify-minimal',label:'Shopify Minimal',category:'Commerce',kind:'ecommerce',tier:'free',style:'minimal',experience:'motion',featured:true,tags:['shopify','store','clean','products'],prompt:'Create a conversion-focused Shopify-style storefront with announcement bar, navigation, collection filters, product cards, product detail, cart drawer, checkout CTA, reviews and email signup.',features:[]},
{id:'shopify-streetwear-3d',label:'Streetwear 3D Store',category:'Commerce',kind:'ecommerce',tier:'pro',style:'bold',experience:'3d',featured:true,tags:['streetwear','shopify','3d','fashion','store'],prompt:'Create an edgy streetwear storefront with interactive 3D hero object, animated product cards, variant selectors, cart drawer, collection pages, launch countdown and motion-rich product storytelling.',features:['advanced_animation']},
{id:'shopify-furniture-3d',label:'Furniture 3D Store',category:'Commerce',kind:'ecommerce',tier:'pro',style:'luxury',experience:'3d',tags:['furniture','home','3d','commerce','shopify'],prompt:'Create a premium furniture store with an interactive 3D product viewer, room-scene product previews, material/color variants, swatches, wishlist UI, cart and editorial collection storytelling.',features:['advanced_animation']},
{id:'shopify-beauty',label:'Beauty Commerce',category:'Commerce',kind:'ecommerce',tier:'free',style:'luxury',experience:'motion',tags:['beauty','skincare','shop','commerce'],prompt:'Create a premium beauty ecommerce storefront with category navigation, product cards, ingredients, reviews, routines, bundles, product detail, cart and responsive mobile commerce UX.',features:[]},
{id:'electronics-store',label:'Electronics Store',category:'Commerce',kind:'ecommerce',tier:'free',style:'modern',experience:'motion',tags:['electronics','gadgets','store','products'],prompt:'Create an electronics ecommerce site with smart filters, comparison cards, product variants, specifications, reviews, stock states, cart, checkout CTA and support sections.',features:[]},
{id:'premium-product-3d',label:'Premium Product 3D',category:'Commerce',kind:'ecommerce',tier:'pro',style:'minimal',experience:'3d',featured:true,tags:['product launch','3d','commerce','premium'],prompt:'Create a cinematic 3D commerce landing page where the product is the hero: orbit viewer, hotspots, materials, specs, sticky purchase panel, variant pricing and scroll-driven storytelling.',features:['advanced_animation']},

{id:'creative-studio-3d',label:'Creative Studio 3D',category:'Agency',kind:'agency',tier:'pro',style:'editorial',experience:'3d',featured:true,tags:['agency','studio','3d','case studies'],prompt:'Create a premium creative studio website with a 3D hero, project gallery, magnetic interactions, case studies, services, team and cinematic transition choreography.',features:['advanced_animation']},
{id:'consulting-business',label:'Consulting Firm',category:'Business',kind:'business',tier:'free',style:'corporate',experience:'motion',tags:['consulting','business','services'],prompt:'Create a professional consulting website with industry expertise, services, case studies, team, insights, lead capture and trust sections.',features:[]},
{id:'law-firm',label:'Law Firm',category:'Professional Services',kind:'business',tier:'free',style:'editorial',experience:'motion',tags:['law','legal','services','business'],prompt:'Create an authoritative law firm website with practice areas, attorneys, case results placeholders, insights, locations, consultation CTA and accessible typography.',features:[]},
{id:'construction-company',label:'Construction Company',category:'Professional Services',kind:'business',tier:'free',style:'modern',experience:'motion',tags:['construction','contractor','projects'],prompt:'Create a construction company site with services, project gallery, capabilities, safety/trust content, team, locations and quote request CTA.',features:[]},
{id:'home-services',label:'Home Services',category:'Home Services',kind:'local',tier:'free',style:'modern',experience:'motion',featured:true,tags:['plumber','electrician','hvac','local business'],prompt:'Create a local home-services website with service cards, service-area pages, quote form, before/after gallery, reviews, FAQs, phone CTA and booking flow.',features:[]},
{id:'clinic-health',label:'Clinic / Health Practice',category:'Health',kind:'local',tier:'free',style:'minimal',experience:'motion',tags:['clinic','doctor','appointments','health'],prompt:'Create a calm clinic website with services, clinician profiles, appointment booking, insurance information, FAQs, location and accessibility-first mobile UX.',features:[]},
{id:'gym-fitness',label:'Fitness Studio',category:'Wellness',kind:'local',tier:'free',style:'bold',experience:'motion',tags:['gym','fitness','classes','membership'],prompt:'Create an energetic fitness studio website with classes, trainers, schedule, memberships, testimonials, gallery and trial CTA.',features:[]},

{id:'restaurant-3d',label:'Restaurant 3D Experience',category:'Hospitality',kind:'hospitality',tier:'pro',style:'luxury',experience:'3d',featured:true,tags:['restaurant','3d','menu','booking'],prompt:'Create a cinematic restaurant website with a lightweight interactive 3D dining scene, menu cards, chef story, reservations, gallery, wine list and premium motion.',features:['advanced_animation']},
{id:'hotel-3d',label:'Hotel 3D Resort',category:'Hospitality',kind:'hospitality',tier:'pro',style:'luxury',experience:'3d',tags:['hotel','resort','3d','rooms','booking'],prompt:'Create an immersive resort website with interactive 3D property hero, room previews, amenities, gallery, experiences, location, availability CTA and booking flow.',features:['advanced_animation']},

{id:'portfolio-3d',label:'Portfolio 3D Gallery',category:'Portfolio',kind:'portfolio',tier:'pro',style:'futuristic',experience:'3d',featured:true,tags:['portfolio','3d','creative','gallery'],prompt:'Create an immersive personal portfolio with a 3D gallery, project hotspots, case-study transitions, biography, skills, testimonials and inquiry CTA.',features:['advanced_animation']},
{id:'photographer-immersive',label:'Photographer Immersive',category:'Portfolio',kind:'portfolio',tier:'pro',style:'editorial',experience:'3d',tags:['photography','3d','gallery','portfolio'],prompt:'Create a cinematic photography portfolio with depth-based image walls, fullscreen gallery, project stories, booking CTA and reduced-motion fallback.',features:['advanced_animation']},
{id:'freelancer-business',label:'Freelancer Business',category:'Portfolio',kind:'portfolio',tier:'free',style:'minimal',experience:'motion',tags:['freelancer','portfolio','services'],prompt:'Create a freelancer website with service packages, selected work, testimonials, about, process, contact and inquiry form.',features:[]},

{id:'course-immersive',label:'Immersive Course Academy',category:'Education',kind:'education',tier:'pro',style:'futuristic',experience:'3d',tags:['courses','education','3d','learning'],prompt:'Create a modern learning platform landing site with an interactive 3D hero, course catalog, curriculum, instructors, outcomes, testimonials and enrollment CTA.',features:['advanced_animation']},
{id:'conference-immersive',label:'Conference 3D',category:'Event',kind:'event',tier:'pro',style:'futuristic',experience:'3d',tags:['conference','event','3d','speakers'],prompt:'Create an event website with a 3D venue hero, schedule, speakers, sponsors, maps, ticket tiers and animated transitions.',features:['advanced_animation']},
{id:'property-gallery',label:'Property Listing Gallery',category:'Real Estate',kind:'realEstate',tier:'free',style:'minimal',experience:'motion',tags:['real estate','listings','properties','agents'],prompt:'Create a data-driven property listing website with filters, cards, saved-search UI, property details, agents, inquiry forms and responsive mobile layout.',features:[]},
{id:'property-3d-developer',label:'Real Estate Developer 3D',category:'Real Estate',kind:'realEstate',tier:'pro',style:'futuristic',experience:'3d',featured:true,tags:['real estate developer','masterplan','3d','plots','units'],prompt:'Create a developer website with interactive 3D masterplan, buildings/plots, unit inventory, availability states, floorplan previews, amenity map and lead capture.',features:['advanced_animation']},

{id:'blog-magazine',label:'Editorial Magazine',category:'Content',kind:'content',tier:'free',style:'editorial',experience:'motion',tags:['blog','magazine','content','editorial'],prompt:'Create a magazine-style content site with featured stories, categories, search, article pages, author profiles, newsletter and accessible reading layout.',features:[]},
{id:'creator-store',label:'Creator Store + Portfolio',category:'Creator',kind:'ecommerce',tier:'free',style:'playful',experience:'motion',tags:['creator','digital products','portfolio','store'],prompt:'Create a creator website combining portfolio, digital products, bundles, testimonials, newsletter, about and a simple cart-ready storefront.',features:[]},
{id:'marketplace-3d',label:'Marketplace 3D',category:'Marketplace',kind:'marketplace',tier:'pro',style:'futuristic',experience:'3d',tags:['marketplace','vendors','3d','commerce'],prompt:'Create a marketplace experience with vendor profiles, categories, filters, product grid, 3D hero, product detail, cart and vendor storytelling.',features:['advanced_animation']},
{id:'saas-product-3d',label:'SaaS Product 3D',category:'SaaS',kind:'business',tier:'pro',style:'futuristic',experience:'3d',tags:['saas','3d','product','interactive'],prompt:'Create a SaaS product marketing site with an interactive 3D product/dashboard scene, feature hotspots, pricing, integrations, testimonials and conversion-focused motion.',features:['advanced_animation']},

{id:'job-board',label:'Job Board & Hiring',category:'Employment',kind:'business',tier:'free',style:'modern',experience:'motion',tags:['jobs','job board','recruiting','careers'],prompt:'Create a searchable job board with job listings, filters, job detail pages, candidate application flow, employer profiles, saved jobs, alerts and an owner admin portal.',features:[]},
{id:'business-directory',label:'Business Directory',category:'Directory',kind:'marketplace',tier:'free',style:'editorial',experience:'motion',featured:true,tags:['directory','local business','listings','reviews','search'],prompt:'Create a business directory with category filters, location search, listing detail pages, claimed business profiles, reviews, contact actions and owner admin controls.',features:[]},
{id:'appointment-booking',label:'Appointment Booking',category:'Booking',kind:'local',tier:'free',style:'minimal',experience:'motion',tags:['appointments','booking','calendar','services'],prompt:'Create a service-booking website with provider profiles, services, availability calendar, appointment flow, confirmations, FAQs, service areas and owner admin management.',features:[]},
{id:'membership-community',label:'Membership Community',category:'Community',kind:'business',tier:'free',style:'modern',experience:'motion',tags:['community','membership','profiles','discussion','events'],prompt:'Create a membership community with public landing pages, member profiles, gated resources, discussions, events, plans, onboarding and owner admin controls.',features:[]},
{id:'docs-knowledge-base',label:'Docs & Knowledge Base',category:'Documentation',kind:'content',tier:'free',style:'minimal',experience:'motion',featured:true,tags:['documentation','knowledge base','help center','search'],prompt:'Create a searchable documentation and knowledge-base site with categories, article pages, navigation, version labels, author metadata, feedback controls and owner publishing tools.',features:[]},
{id:'operations-dashboard',label:'Operations Dashboard',category:'SaaS',kind:'business',tier:'free',style:'corporate',experience:'motion',tags:['dashboard','operations','analytics','admin','workflow'],prompt:'Create an operations dashboard with KPIs, tables, filters, activity logs, role-aware navigation, status workflows, notifications and an owner admin portal.',features:[]},
{id:'subscription-commerce',label:'Subscription Commerce',category:'Commerce',kind:'ecommerce',tier:'free',style:'luxury',experience:'motion',tags:['subscription','commerce','recurring','bundles'],prompt:'Create a subscription commerce site with plans, product bundles, recurring billing UI, account area, product catalog, checkout CTA, FAQs and owner content management.',features:[]},
{id:'real-estate-rentals',label:'Real Estate Rentals',category:'Real Estate',kind:'realEstate',tier:'free',style:'modern',experience:'motion',tags:['rentals','apartments','property','search'],prompt:'Create a rental property marketplace with availability filters, listing detail pages, neighborhood content, inquiry flow, landlord profiles, saved listings and an owner admin portal.',features:[]},];

const MOTION_BY_STYLE={luxury:{mode:'luxury',scroll:'cinematic-reveal',reveal:'soft-clip',hover:'magnetic',transition:'shared-layout'},editorial:{mode:'editorial',scroll:'chapter',reveal:'split-and-clip',hover:'underline-lift',transition:'shared-layout'},futuristic:{mode:'cinematic',scroll:'depth',reveal:'glow-and-scale',hover:'magnetic',transition:'shared-layer'},playful:{mode:'playful',scroll:'story',reveal:'spring',hover:'tilt',transition:'shared-layout'},minimal:{mode:'smooth',scroll:'subtle',reveal:'fade-up',hover:'lift',transition:'shared-layout'},bold:{mode:'snappy',scroll:'snap-story',reveal:'wipe',hover:'magnetic',transition:'shared-layout'},retro:{mode:'playful',scroll:'chapter',reveal:'wipe',hover:'tilt',transition:'shared-layout'},brutalist:{mode:'snappy',scroll:'hard-cut',reveal:'hard-cut',hover:'contrast',transition:'instant'},modern:{mode:'smooth',scroll:'story',reveal:'clip-and-fade',hover:'magnetic',transition:'shared-layout'}};
function motionProfile(t){const base=MOTION_BY_STYLE[t.style]||MOTION_BY_STYLE.modern;const immersive=t.experience==='3d';return immersive?{...base,mode:'cinematic',scroll:'camera-story',reveal:'depth',hover:'focus',transition:'shared-camera',scene:true,webglFallback:true}:{...base,scene:false,webglFallback:false};}

const QUALITY_BY_KIND={
  ecommerce:['catalog/product states','cart and checkout','inventory/availability','search and filtering'],
  marketplace:['vendor/listing states','catalog/product states','cart and checkout','search and filtering'],
  hospitality:['booking/availability states','gallery/media fallbacks','contact/conversion path'],
  realEstate:['search and filtering','property detail states','lead/contact flow'],
  education:['course discovery','enrollment flow','accessible reading states'],
  event:['schedule/registration states','speaker/event content','responsive navigation'],
  content:['draft/publish content workflow','search and filtering','reading accessibility'],
  portfolio:['case-study storytelling','media fallbacks','contact/conversion path'],
  agency:['services/case studies','lead/contact flow','team/content states'],
  local:['service-area content','quote/booking flow','review/testimonial states'],
  immersive:['user-controlled immersive interactions','WebGL fallback','media fallbacks'],
  business:['service/content states','lead/contact flow','owner admin surface']
};

function templateQuality(t){
  const surfaces=['/','/about','/contact','/privacy','/terms'];
  if(['ecommerce','marketplace'].includes(t.kind))surfaces.push('/shop','/collections','/cart','/checkout');
  if(t.kind==='hospitality')surfaces.push('/booking');
  if(t.kind==='realEstate')surfaces.push('/properties');
  if(t.kind==='education')surfaces.push('/courses');
  if(t.kind==='content')surfaces.push('/blog');
  if(t.kind==='event')surfaces.push('/schedule');
  if(['portfolio','agency'].includes(t.kind))surfaces.push('/work');
  if(t.experience==='3d')surfaces.push('/experience');
  const requiredFeatures=['responsive UI','accessible navigation and forms','reduced-motion support','SEO metadata and canonical URL','local assets/runtime','local content/data editing',...(QUALITY_BY_KIND[t.kind]||QUALITY_BY_KIND.business)];
  return {
    version:'template-quality.v2',
    providerIndependent:true,
    qualityTier:t.experience==='3d'?'immersive':'production',
    requiredStates:['loading','empty','error','success'],
    requiredSurfaces:[...new Set(surfaces)],
    requiredFeatures:[...new Set(requiredFeatures)],
    motion:t.motion?.mode||null,
    webglFallback:Boolean(t.experience==='3d'),
    localRuntime:true
  };
}

function templateCapabilities(t){
  const out=['responsive','accessible','seo','local-runtime','content-editing'];
  if(['business','local','agency','portfolio','hospitality','realEstate','education','event','content'].includes(t.kind))out.push('admin','contact');
  if(['ecommerce','marketplace'].includes(t.kind))out.push('catalog','cart','checkout','inventory','filters');
  if(t.kind==='marketplace')out.push('vendors');
  if(t.kind==='hospitality')out.push('booking','calendar');
  if(t.kind==='realEstate')out.push('property-search','3d-ready');
  if(t.kind==='education')out.push('courses','enrollment');
  if(t.kind==='content')out.push('authors','search');
  if(t.kind==='event')out.push('schedule','registration');
  if(t.experience==='3d')out.push('webgl-fallback','camera-story');
  if(t.experience==='motion')out.push('scroll-motion','microinteractions');
  return [...new Set(out)];
}

function publicTemplate(t){
  const motion=motionProfile(t);
  const base={...t,motion,features:[...t.features],tags:[...t.tags]};
  return {...base,qualityContract:templateQuality({...base,motion}),capabilities:templateCapabilities(t),prompt:undefined};
}

export function listTemplates(){return TEMPLATES.map(publicTemplate);}
export function getTemplate(id){const t=TEMPLATES.find(t=>t.id===String(id));return t?publicTemplate(t):null;}
export function searchTemplates(query='',{category='',kind='',experience='',tier='',featured=false,limit=80}={}){
  const q=String(query).toLowerCase().trim(),tokens=q.split(/\s+/).filter(Boolean);
  const c=String(category).toLowerCase().trim(),k=String(kind).toLowerCase().trim(),e=String(experience).toLowerCase().trim(),ti=String(tier).toLowerCase().trim();
  const filtered=listTemplates().filter(t=>
    (!c||t.category.toLowerCase()===c||t.tags.some(x=>x.toLowerCase()===c))&&
    (!k||t.kind.toLowerCase()===k)&&
    (!e||t.experience.toLowerCase()===e)&&
    (!ti||t.tier===ti)&&
    (!featured||t.featured)
  );
  const ranked=filtered.map((t,index)=>{
    const hay=[t.label,t.category,t.kind,t.experience,t.style,...t.tags,...t.capabilities].join(' ').toLowerCase();
    let score=0;
    for(const token of tokens){
      if(t.label.toLowerCase()===token)score+=30;
      if(t.label.toLowerCase().includes(token))score+=12;
      if(t.tags.some(x=>x.toLowerCase()===token))score+=10;
      if(t.kind.toLowerCase()===token)score+=8;
      if(t.experience.toLowerCase()===token)score+=8;
      if(t.capabilities.some(x=>x===token))score+=7;
      if(hay.includes(token))score+=2;
    }
    if(tokens.length&&t.featured)score+=1;
    if(!tokens.length&&t.featured)score+=1;
    return {t,index,score};
  }).sort((a,b)=>b.score-a.score||a.index-b.index);
  return ranked.slice(0,Math.max(1,Math.min(Number(limit)||80,100))).map(x=>x.t);
}
export function templatePrompt(id){
  const t=TEMPLATES.find(t=>t.id===String(id));
  if(!t)return '';
  const quality=templateQuality({...t,motion:motionProfile(t)});
  return t.prompt+'\n\nQuality contract: '+quality.requiredFeatures.join(', ')+'. Core runtime must remain provider-independent and degrade gracefully when optional integrations are unavailable.';
}
