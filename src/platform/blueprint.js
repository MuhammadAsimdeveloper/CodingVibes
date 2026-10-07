import {inferTarget,getTarget} from '../targets/registry.js';
import {listCapabilities} from './capabilities.js';

const WORDS = {
  commerce:['shop','store','ecommerce','e-commerce','products','cart','checkout'],
  cms:['blog','news','magazine','content','articles','posts','cms'],
  booking:['booking','appointment','reservation','calendar','schedule'],
  marketplace:['marketplace','seller','vendor','buyers','listing'],
  saas:['saas','subscription','workspace','dashboard','team','billing'],
  ai:['ai','assistant','chatbot','agent','copilot','generator'],
  property:['real estate','property','house','apartment','villa','tour'],
  education:['course','academy','school','learning','student'],
  community:['community','forum','social','members','feed'],
  auth:['login','sign in','signup','account','authentication'],
  payments:['payment','stripe','checkout','subscription','billing'],
};

function hasAny(text,words){return words.some(w=>text.includes(w));}
function detectKinds(text){
  const kinds=[];
  for(const [kind,words] of Object.entries(WORDS))if(hasAny(text,words))kinds.push(kind);
  return kinds.length?kinds:['website'];
}
function unique(a){return [...new Set(a)];}

function resolveTargets(request,targetId){
  const text=String(request||'').toLowerCase();
  const primary=inferTarget(request,targetId);
  const targets=[primary];
  const wantsWeb=/\b(web|website|web app|pwa|site)\b/.test(text);
  const wantsAndroid=/\b(android|apk|aab)\b/.test(text);
  const wantsIos=/\b(ios|iphone|ipad)\b/.test(text);
  if(wantsWeb && (wantsAndroid||wantsIos) && primary.family!=='web')targets.unshift(getTarget('web-node'));
  if(wantsAndroid && !targets.some(x=>x.family==='android'||x.id==='mobile-expo'))targets.push(getTarget('mobile-expo'));
  if(wantsIos && !targets.some(x=>x.family==='ios'||x.id==='mobile-expo'))targets.push(getTarget('mobile-expo'));
  return [...new Map(targets.filter(Boolean).map(x=>[x.id,x])).values()];
}

export function buildBlueprint(request,{targetId='auto'}={}){
  const text=String(request||'').toLowerCase();
  const kinds=detectKinds(text);
  const target=inferTarget(request,targetId);
  const targetMatrix=resolveTargets(request,targetId);
  const authRequired=hasAny(text,WORDS.auth)||hasAny(text,['admin','portal','members','customers']);
  const paymentRequired=hasAny(text,WORDS.payments)||kinds.includes('commerce');
  const databaseRequired=authRequired||paymentRequired||kinds.some(k=>['booking','marketplace','saas','community','education','property'].includes(k));
  const capabilities=unique([
    'website','web-app',
    ...(databaseRequired?['backend']:[]),
    ...(authRequired?['backend']:[]),
    ...(paymentRequired?['commerce']:[]),
    ...(kinds.includes('cms')?['cms']:[]),
    ...(kinds.includes('ai')?['ai']:[]),
    ...(kinds.includes('property')?['3d']:[]),
    ...(target.family==='android'||target.family==='mobile'?['android']:[]),
    ...(target.family==='ios'||target.family==='mobile'?['ios']:[]),
    ...(target.family==='desktop'?['desktop']:[]),
    'deployment','security'
  ]);
  return {
    version:'product-blueprint.v1',
    request:String(request||'').trim(),
    productKinds:kinds,
    target:{id:target.id,family:target.family,label:target.label,framework:target.framework},
    targets:targetMatrix.map(x=>({id:x.id,family:x.family,label:x.label,framework:x.framework,artifactTypes:x.artifactTypes})),
    capabilities,
    architecture:{
      presentation:'visual-product',
      content:'structured',
      backend:databaseRequired?'required':'optional',
      authentication:authRequired?'owner-admin'+(text.includes('google')?' + google':''):'owner-admin',
      payments:paymentRequired,
      portability:true,
      providerNeutral:true,
    },
    generatedSurfaces:['visual canvas','AI builder','content manager','data manager','admin portal','preview','publish'],
    nextActions:['Generate product','Customize design','Add data','Connect integrations','Verify','Publish'],
    completion:{autoFillMissing:true,defaults:['responsive','accessible','reduced-motion','SEO metadata','legal surfaces','contact/conversion path','owner admin','error/loading/empty/success states','local assets/runtime'],qualityGate:'product-quality.v2',providerIndependentCore:true},
    setup:{
      mode:'beginner-first',
      coreMode:'local-first',
      canStartWithoutProvider:true,
      steps:['Describe the product in plain language','Review the automatically completed plan','Build and preview','Fix verified issues automatically when possible','Publish or export the verified result'],
      defaults:['responsive','accessible','reduced-motion','SEO','legal pages','content editing','error/loading/empty/success states'],
      optionalProviders:['AI model provider','research provider','hosting','database','email','payments','analytics'],
      toolchainRequired:Boolean(target.native)
    },
    catalog:listCapabilities().filter(x=>capabilities.includes(x.id)),
  };
}
