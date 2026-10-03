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

export function buildBlueprint(request,{targetId='auto'}={}){
  const text=String(request||'').toLowerCase();
  const kinds=detectKinds(text);
  const target=inferTarget(request,targetId);
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
    catalog:listCapabilities().filter(x=>capabilities.includes(x.id)),
  };
}
