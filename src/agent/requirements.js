import {hash} from '../core/hash.js';
import {inferTarget} from '../targets/registry.js';
import {inferDesignSystem} from './design-system.js';
import {kitForKind,SITE_KITS} from '../site/kits.js';
import {buildQualityContract} from './product-quality.js';
const clean=s=>String(s??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,' ').trim();
const has=(s,...xs)=>xs.some(x=>s.includes(x.toLowerCase()));
const titleize=s=>String(s).split(/[-_\s]+/).filter(Boolean).map(x=>x[0]?.toUpperCase()+x.slice(1)).join('');
export function completeSpec(raw={}){
 const spec=raw&&typeof raw==='object'?raw:{};
 const pages=Array.isArray(spec.pages)?[...new Set(spec.pages)]:['/','/admin'];
 const apis=Array.isArray(spec.apis)?[...spec.apis]:[];
 const kind=String(spec.siteKind||'business');
 const behavior={...(spec.behavior||{})};
 const addPage=p=>{if(!pages.includes(p))pages.push(p)};
 const addApi=(method,path)=>{if(!apis.some(a=>String(a.method||'GET').toUpperCase()===method&&a.path===path))apis.push({method,path})};
 addPage('/privacy'); addPage('/terms');
 if(kind!=='immersive'){addPage('/contact');addPage('/thank-you');}
 if(['business','local','agency','portfolio','hospitality','realEstate','education','event','content'].includes(kind)) addPage('/about');
 if(['ecommerce','marketplace'].includes(kind)){addPage('/shop');addPage('/collections');addPage('/cart');addPage('/checkout');addPage('/account');addApi('GET','/api/products');addApi('POST','/api/orders')};
 if(kind==='hospitality'||behavior.booking||spec.productKinds?.includes?.('booking')){addPage('/booking');addPage('/calendar');addApi('GET','/api/appointments');behavior.booking=true;}
 const requestText=String(spec.request||'');
 const productKinds=Array.isArray(spec.productKinds)?spec.productKinds:[];
 const saasLike=/\b(saas|subscription|customer portal|client portal|member portal)\b/i.test(requestText)||productKinds.includes('saas');
 if(saasLike){addPage('/pricing');addPage('/signup');addPage('/login');addPage('/dashboard');addPage('/settings');behavior.authentication=true;behavior.publicLogin=true;behavior.providerOptional=true;behavior.localFirstAuth=true;addApi('GET','/api/auth/session');addApi('POST','/api/auth/signup');}
 if(kind==='marketplace'){addPage('/vendors');behavior.catalog=true;behavior.search=true;}
 if(kind==='content'){addPage('/blog');behavior.cms=true;behavior.search=true;}
 if(kind==='education'){addPage('/courses');behavior.search=true;}
 if(kind==='event')addPage('/schedule');
 if(kind==='realEstate')addPage('/properties');
 if(behavior.payments){addPage('/checkout');addApi('POST','/api/orders')};
 behavior.contactForm=true; addApi('POST','/api/contact');
 behavior.legalPages=true; behavior.launchReadyDefaults=true; behavior.localFirstRuntime=true; behavior.externalProvidersOptional=true;
 const autoCompleted=[...new Set([...(Array.isArray(spec.autoCompleted)?spec.autoCompleted:[]),'responsive UI','accessible focus and form states','loading/empty/error/success states','contact/conversion path','privacy and terms pages','SEO metadata and sitemap','owner admin surface','provider-independent runtime'])];
 const qualityContract=buildQualityContract({...spec,pages,behavior});
 return {...spec,pages,apis,behavior,qualityContract,autoCompleted};
}

export function analyzeRequirements(request,{targetId='auto'}={}){
 const text=clean(request), lower=text.toLowerCase(), target=inferTarget(text,targetId);
 const templateMatch=text.match(/TEMPLATE BLUEPRINT:\s*(\{[\s\S]*?\})\s*\n\s*CUSTOM USER REQUIREMENTS:/i);
 let templateMeta=null;try{templateMeta=templateMatch?JSON.parse(templateMatch[1]):null}catch{}
 const inferredKind=templateMeta?.kind||(['shopify','ecommerce','online store','retail','catalog','products','checkout'].some(x=>lower.includes(x))?'ecommerce':['marketplace','multi-vendor'].some(x=>lower.includes(x))?'marketplace':['portfolio','personal site','photographer'].some(x=>lower.includes(x))?'portfolio':['agency','studio','creative agency'].some(x=>lower.includes(x))?'agency':['real estate','property','property developer','listing'].some(x=>lower.includes(x))?'realEstate':['restaurant','hotel','resort','hospitality','cafe'].some(x=>lower.includes(x))?'hospitality':['course','academy','education','learning'].some(x=>lower.includes(x))?'education':['blog','magazine','article','content'].some(x=>lower.includes(x))?'content':['conference','event','speaker'].some(x=>lower.includes(x))?'event':['immersive','3d site','3d experience','webgl'].some(x=>lower.includes(x))?'immersive':['local service','contractor','plumber','clinic','gym'].some(x=>lower.includes(x))?'local':'business');
 const siteKind=SITE_KITS[inferredKind]?inferredKind:'business';const siteKit=kitForKind(siteKind);
 const type=has(lower,'dashboard','saas','portal','admin')?'dashboard':has(lower,'shop','store','ecommerce','commerce','checkout')?'commerce':has(lower,'blog','article','cms')?'content':'webapp';
 const publicLogin=has(lower,'login','sign in','signin','authentication','google login'); const googleLogin=has(lower,'google login','google oauth','continue with google');
 const pages=['/','/admin'];
 if(['ecommerce','marketplace'].includes(siteKind)){pages.push('/shop','/collections','/cart');if(has(lower,'account','login'))pages.push('/account');}
 if(siteKind==='portfolio'||siteKind==='agency')pages.push('/work');
 if(siteKind==='realEstate')pages.push('/properties');
 if(siteKind==='hospitality')pages.push('/booking');
 if(siteKind==='education')pages.push('/courses');
 if(siteKind==='content')pages.push('/blog');
 if(siteKind==='event')pages.push('/schedule');
 const add=(p,...keys)=>{if(has(lower,...keys)&&!pages.includes(p))pages.push(p);};
 if(publicLogin&&!pages.includes('/login'))pages.push('/login');add('/signup','signup','register');add('/dashboard','dashboard','portal');add('/admin','admin');add('/pricing','pricing','subscription','plans');add('/about','about');add('/contact','contact');add('/blog','blog','articles');add('/shop','shop','store','products');add('/checkout','checkout','payment');add('/settings','settings','preferences');add('/calendar','calendar','schedule');add('/analytics','analytics','metrics','reports');
 const dataModel=[];const addData=(name,fields)=>{if(!dataModel.some(x=>x.name===name))dataModel.push({name,fields});};
 if(has(lower,'user','account','login','auth'))addData('users',[['id','text'],['email','text'],['name','text'],['created_at','timestamp']]);
 if(has(lower,'product','shop','store','ecommerce'))addData('products',[['id','text'],['name','text'],['description','text'],['price','number'],['created_at','timestamp']]);
 if(has(lower,'order','checkout','shop'))addData('orders',[['id','text'],['user_id','text'],['status','text'],['total','number'],['created_at','timestamp']]);
 if(has(lower,'appointment','booking','reservation','calendar'))addData('appointments',[['id','text'],['user_id','text'],['starts_at','timestamp'],['status','text'],['created_at','timestamp']]);
 if(has(lower,'post','blog','article','cms'))addData('posts',[['id','text'],['author_id','text'],['title','text'],['body','text'],['published_at','timestamp']]);
 if(['ecommerce','marketplace'].includes(siteKind)){addData('collections',[['id','text'],['title','text'],['handle','text'],['description','text']]);addData('products',[['id','text'],['title','text'],['handle','text'],['description','text'],['price','number'],['currency','text'],['compareAtPrice','number'],['sku','text'],['inventory','number'],['status','text'],['featured','boolean'],['category','text'],['tags','json'],['collectionIds','json'],['images','json'],['variants','json'],['seo','json'],['customFields','json']]);addData('orders',[['id','text'],['customer_id','text'],['line_items','json'],['status','text'],['subtotal','number'],['discount','number'],['tax','number'],['shipping','number'],['total','number'],['currency','text'],['created_at','timestamp']]);}
 if(siteKind==='hospitality')addData('rooms',[['id','text'],['title','text'],['description','text'],['images','json'],['status','text']]);
 if(siteKind==='realEstate')addData('properties',[['id','text'],['title','text'],['description','text'],['price','number'],['images','json'],['status','text']]);
 const paymentProvider=has(lower,'stripe')?'stripe':has(lower,'paypal')?'paypal':has(lower,'razorpay')?'razorpay':null;
 const apis=[];if(publicLogin)apis.push({method:'GET',path:'/api/auth/session'});apis.push({method:'GET',path:'/api/admin/overview'});if(pages.includes('/signup'))apis.push({method:'POST',path:'/api/auth/signup'});if(pages.includes('/shop'))apis.push({method:'GET',path:'/api/products'});if(pages.includes('/checkout')){apis.push({method:'POST',path:'/api/orders'});if(paymentProvider==='stripe')apis.push({method:'POST',path:'/api/checkout/session'});if(paymentProvider)apis.push({method:'POST',path:`/api/webhooks/${paymentProvider}`});}apis.push({method:'GET',path:'/api/admin/session'});if(pages.includes('/blog'))apis.push({method:'GET',path:'/api/posts'});if(pages.includes('/calendar'))apis.push({method:'GET',path:'/api/appointments'});if(pages.includes('/analytics'))apis.push({method:'GET',path:'/api/analytics'});
 const components=[...new Set(['AppShell',...pages.flatMap(p=>p==='/'?['Hero','FeatureSection']:p.slice(1).split('-').map(x=>titleize(x)+'Page'))])];
 const templateStyle=templateMeta?.style;
 const visual={
  style:templateStyle|| (has(lower,'minimal','clean')?'minimal':has(lower,'brutalist','brutal')?'brutalist':has(lower,'editorial','magazine')?'editorial':has(lower,'retro','vintage')?'retro':has(lower,'glass','glassmorphism')?'glass':has(lower,'luxury','premium')?'luxury':has(lower,'futuristic','sci-fi','cyberpunk')?'futuristic':has(lower,'playful','friendly')?'playful':has(lower,'bold','vibrant')?'bold':'modern'),
  animation:templateMeta?.experience==='motion'||templateMeta?.experience==='3d'||has(lower,'animated','animation','motion','microinteraction','scroll reveal','parallax','gsap','framer motion'),
  threeD:templateMeta?.experience==='3d'||has(lower,'3d','3-d','webgl','three.js','threejs','immersive','depth','babylon'),
  canvas:has(lower,'canvas','particle','particles','shader','generative'),
  gradients:has(lower,'gradient','aurora','neon'),
  glass:has(lower,'glass','glassmorphism','frosted'),
  typography:has(lower,'serif','editorial','display font','monospace','typewriter')?'custom':'system',
  density:has(lower,'dense','compact')?'dense':has(lower,'airy','spacious')?'airy':'comfortable'
 };
 const behavior={authentication:publicLogin,publicLogin,googleLogin,adminPortal:true,ownerOnlyAdmin:true,adminPersistence:'project-file',payments:has(lower,'payment','checkout','purchase'),catalog:['ecommerce','marketplace'].includes(siteKind),cart:['ecommerce','marketplace'].includes(siteKind),inventory:has(lower,'inventory','stock','availability'),wishlist:has(lower,'wishlist','save for later'),cms:has(lower,'cms','content','blog'),paymentProvider,realtime:has(lower,'realtime','live','chat'),search:has(lower,'search','filter'),offline:has(lower,'offline','pwa'),camera:has(lower,'camera','scan','barcode','qr'),location:has(lower,'location','gps','geolocation','map'),notifications:has(lower,'notification','push notification'),files:has(lower,'upload','download','file'),biometrics:has(lower,'biometric','fingerprint','face id')};
 const transformExisting=/\b(transform|convert|turn|redesign|upgrade|animate|make it animated|make this site 3d)\b/.test(lower) && /\b(existing|current|this site|website)\b/.test(lower);
 const propertyTour=(has(lower,'real estate','property','house','home','villa','apartment')&&has(lower,'3d','three.js','virtual tour','walkthrough','floor plan'));
 const videoPlayback=has(lower,'video playback','video tour','video walkthrough','mp4','webm','trailer');
 const recording=has(lower,'record tour','record camera','export video','download tour');
 if(!dataModel.some(x=>x.name==='site_content'))dataModel.push({name:'site_content',fields:[['version','text'],['brand','json'],['settings','json'],['navigation','json']]});
 const experience={type:propertyTour?'property-tour':visual.threeD?'interactive-3d':visual.animation?'animated-site':'standard-site',threeD:Boolean(visual.threeD),animation:Boolean(visual.animation),transformExisting,propertyTour,videoPlayback,recording,assets:propertyTour?['glb/gltf','floorplan','images','mp4/webm']:[]};
 const seo={title: '',description:'',canonical:true,robots:true,sitemap:true,structuredData:true,semanticHtml:true,openGraph:true};
 const styling={tone:visual.style==='minimal'?'minimal':visual.style==='bold'?'bold':'modern',responsive:true,accessibility:true,reducedMotion:true,darkMode:has(lower,'dark','dark mode'),visual,designSystem:inferDesignSystem(text,visual)};
 const deliverables=[...target.artifactTypes];
 const acceptance=[...pages.map(p=>`Page ${p} loads successfully`),'Owner admin portal is present and owner-only','Admin content can be viewed and edited without rewriting the visual template',...apis.map(a=>`${a.method} ${a.path} responds successfully`),'No uncaught browser console errors','No failed preview requests','Keyboard navigation and visible focus states work','Primary content remains usable when optional visual effects fail',`Target ${target.id} is represented by the expected project structure`];
 if(publicLogin)acceptance.push('Public login works with the built-in provider-neutral session/auth boundary and keeps optional identity-provider secrets server-side');
 if(googleLogin)acceptance.push('Optional Google OAuth keeps Google client secrets server-side and fails closed when not configured');
 if(behavior.payments)acceptance.push('Payment flow never accepts raw card data on the application server','Checkout/payment provider credentials remain server-side','Payment completion is verified through provider webhook or server confirmation');
 if(visual.animation)acceptance.push('Motion respects prefers-reduced-motion and avoids blocking page content');
 if(visual.threeD)acceptance.push('3D/immersive visual layer loads without uncaught runtime errors and degrades when WebGL is unavailable');
 if(experience.transformExisting)acceptance.push('Existing working behavior is preserved while the requested visual transformation is isolated and reviewable');
 if(experience.propertyTour)acceptance.push('3D property experience supports model input, procedural fallback, camera tour, room hotspots, floor plan and video playback');
 if(experience.videoPlayback)acceptance.push('Video uses accessible controls, responsive loading, poster/fallback messaging and does not block the primary page');
 if(experience.recording)acceptance.push('Tour recording remains optional, bounded and user-initiated');
 acceptance.push('Core SEO metadata, canonical URL, semantic HTML, Open Graph metadata, robots and sitemap are present','Legal/privacy routes are present for launch readiness','A contact/conversion path is present for customer-facing sites','Generated UI uses responsive layouts and accessible form labels');
 if(target.native)acceptance.push(`Target toolchain verification is required before the build can be marked verified`);
 return completeSpec({version:'spec.v3',id:hash({text,target:target.id,siteKind}),request:text,appType:type,siteKind,siteTemplateId:templateMeta?.id||'',siteTemplateLabel:templateMeta?.label||'',contentModel:{kit:siteKind,collections:[...siteKit.collections],features:[...siteKit.features]},target,deliverables,stack:{runtime:target.runtime,language:target.language,frontend:target.framework,server:target.family==='web'?'node-http':target.framework,packageManager:target.packageManager},pages,components,apis,dataModel,behavior,styling,seo,experience,acceptance:acceptance.slice(0,60),scope:{words:text.split(/\s+/).filter(Boolean).length}});
}
