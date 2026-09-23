import {hash} from '../core/hash.js';
import {inferTarget} from '../targets/registry.js';
import {inferDesignSystem} from './design-system.js';
const clean=s=>String(s??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,' ').trim();
const has=(s,...xs)=>xs.some(x=>s.includes(x.toLowerCase()));
const titleize=s=>String(s).split(/[-_\s]+/).filter(Boolean).map(x=>x[0]?.toUpperCase()+x.slice(1)).join('');
export function analyzeRequirements(request,{targetId='auto'}={}){
 const text=clean(request), lower=text.toLowerCase(), target=inferTarget(text,targetId);
 const type=has(lower,'dashboard','saas','portal','admin')?'dashboard':has(lower,'shop','store','ecommerce','commerce','checkout')?'commerce':has(lower,'blog','article','cms')?'content':'webapp';
 const pages=['/'];
 const add=(p,...keys)=>{if(has(lower,...keys)&&!pages.includes(p))pages.push(p);};
 add('/login','login','sign in','authentication','account','accounts');add('/signup','signup','register');add('/dashboard','dashboard','portal');add('/admin','admin');add('/pricing','pricing','subscription','plans');add('/about','about');add('/contact','contact');add('/blog','blog','articles');add('/shop','shop','store','products');add('/checkout','checkout','payment');add('/settings','settings','preferences');add('/calendar','calendar','schedule');add('/analytics','analytics','metrics','reports');
 const dataModel=[];const addData=(name,fields)=>{if(!dataModel.some(x=>x.name===name))dataModel.push({name,fields});};
 if(has(lower,'user','account','login','auth'))addData('users',[['id','text'],['email','text'],['name','text'],['created_at','timestamp']]);
 if(has(lower,'product','shop','store','ecommerce'))addData('products',[['id','text'],['name','text'],['description','text'],['price','number'],['created_at','timestamp']]);
 if(has(lower,'order','checkout','shop'))addData('orders',[['id','text'],['user_id','text'],['status','text'],['total','number'],['created_at','timestamp']]);
 if(has(lower,'appointment','booking','reservation','calendar'))addData('appointments',[['id','text'],['user_id','text'],['starts_at','timestamp'],['status','text'],['created_at','timestamp']]);
 if(has(lower,'post','blog','article','cms'))addData('posts',[['id','text'],['author_id','text'],['title','text'],['body','text'],['published_at','timestamp']]);
 const paymentProvider=has(lower,'stripe')?'stripe':has(lower,'paypal')?'paypal':has(lower,'razorpay')?'razorpay':null;
 const apis=[];if(pages.includes('/login'))apis.push({method:'POST',path:'/api/auth/login'});if(pages.includes('/signup'))apis.push({method:'POST',path:'/api/auth/signup'});if(pages.includes('/shop'))apis.push({method:'GET',path:'/api/products'});if(pages.includes('/checkout')){apis.push({method:'POST',path:'/api/orders'});if(paymentProvider==='stripe')apis.push({method:'POST',path:'/api/checkout/session'});if(paymentProvider)apis.push({method:'POST',path:`/api/webhooks/${paymentProvider}`});}if(pages.includes('/admin'))apis.push({method:'GET',path:'/api/admin/overview'});if(pages.includes('/blog'))apis.push({method:'GET',path:'/api/posts'});if(pages.includes('/calendar'))apis.push({method:'GET',path:'/api/appointments'});if(pages.includes('/analytics'))apis.push({method:'GET',path:'/api/analytics'});
 const components=[...new Set(['AppShell',...pages.flatMap(p=>p==='/'?['Hero','FeatureSection']:p.slice(1).split('-').map(x=>titleize(x)+'Page'))])];
 const visual={
  style:has(lower,'minimal','clean')?'minimal':has(lower,'brutalist','brutal')?'brutalist':has(lower,'editorial','magazine')?'editorial':has(lower,'retro','vintage')?'retro':has(lower,'glass','glassmorphism')?'glass':has(lower,'luxury','premium')?'luxury':has(lower,'futuristic','sci-fi','cyberpunk')?'futuristic':has(lower,'playful','friendly')?'playful':has(lower,'bold','vibrant')?'bold':'modern',
  animation:has(lower,'animated','animation','motion','microinteraction','scroll reveal','parallax','gsap','framer motion'),
  threeD:has(lower,'3d','3-d','webgl','three.js','threejs','immersive','depth','babylon'),
  canvas:has(lower,'canvas','particle','particles','shader','generative'),
  gradients:has(lower,'gradient','aurora','neon'),
  glass:has(lower,'glass','glassmorphism','frosted'),
  typography:has(lower,'serif','editorial','display font','monospace','typewriter')?'custom':'system',
  density:has(lower,'dense','compact')?'dense':has(lower,'airy','spacious')?'airy':'comfortable'
 };
 const behavior={authentication:has(lower,'login','auth','account'),payments:has(lower,'payment','checkout','purchase'),paymentProvider,realtime:has(lower,'realtime','live','chat'),search:has(lower,'search','filter'),offline:has(lower,'offline','pwa'),camera:has(lower,'camera','scan','barcode','qr'),location:has(lower,'location','gps','geolocation','map'),notifications:has(lower,'notification','push notification'),files:has(lower,'upload','download','file'),biometrics:has(lower,'biometric','fingerprint','face id')};
 const styling={tone:visual.style==='minimal'?'minimal':visual.style==='bold'?'bold':'modern',responsive:true,accessibility:true,darkMode:has(lower,'dark','dark mode'),visual,designSystem:inferDesignSystem(text,visual)};
 const deliverables=[...target.artifactTypes];
 const acceptance=[...pages.map(p=>`Page ${p} loads successfully`),...apis.map(a=>`${a.method} ${a.path} responds successfully`),'No uncaught browser console errors','No failed preview requests',`Target ${target.id} is represented by the expected project structure`];
 if(behavior.payments)acceptance.push('Payment flow never accepts raw card data on the application server','Checkout/payment provider credentials remain server-side','Payment completion is verified through provider webhook or server confirmation');
 if(visual.threeD)acceptance.push('3D/immersive visual layer loads without uncaught runtime errors');
 if(target.native)acceptance.push(`Target toolchain verification is required before the build can be marked verified`);
 return {version:'spec.v3',id:hash({text,target:target.id}),request:text,appType:type,target,deliverables,stack:{runtime:target.runtime,language:target.language,frontend:target.framework,server:target.family==='web'?'node-http':target.framework,packageManager:target.packageManager},pages,components,apis,dataModel,behavior,styling,acceptance:acceptance.slice(0,60),scope:{words:text.split(/\s+/).filter(Boolean).length}};
}
