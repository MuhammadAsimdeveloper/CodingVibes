const COLOR_NAMES=new Set(['red','blue','green','purple','violet','indigo','pink','orange','yellow','black','white','gray','grey','cyan','teal','lime','gold','brown']);
const COLOR_HEX={black:'#0b1020',white:'#ffffff',red:'#ef4444',blue:'#3b82f6',green:'#22c55e',purple:'#8b5cf6',violet:'#8b5cf6',indigo:'#6366f1',pink:'#ec4899',orange:'#f97316',yellow:'#eab308',cyan:'#06b6d4',teal:'#14b8a6',lime:'#84cc16',gold:'#f59e0b',brown:'#92400e',gray:'#64748b',grey:'#64748b'};
function clean(v,max=300){return String(v??'').trim().slice(0,max)}
function colorFromText(text){const hex=String(text).match(/#[0-9a-f]{3,8}\b/i)?.[0];if(hex)return hex.toLowerCase();const token=String(text).toLowerCase().match(/\b(?:red|blue|green|purple|violet|indigo|pink|orange|yellow|black|white|gray|grey|cyan|teal|lime|gold|brown)\b/)?.[0];return token?COLOR_HEX[token]:null}
export function classifyAssistantRequest(input=''){
  const text=clean(input,4000),lower=text.toLowerCase();
  if(!text)return{mode:'clarify',target:'general',operations:[],confidence:0};
  if(/^(what|how|where|why|can you|help|explain)\b/.test(lower))return{mode:'help',target:'assistant',operations:[],confidence:.98};
  if(/\b(make|change|update|set|switch|remove|add|replace|move|increase|decrease|fix|rename|hide|show)\b/.test(lower)){
    if(/\b3d\b|webgl|model|hotspot|camera tour|walkthrough|material|lighting|scene|floorplan|glb|gltf/.test(lower))return{mode:'modify',target:'3d',operations:[...parseThreeOperations(text)],confidence:.93};
    if(/\b(color|colour|theme|background|button|font|typography|radius|spacing|layout|dark|light|animation|motion)\b/.test(lower))return{mode:'modify',target:'design',operations:[...parseDesignOperations(text)],confidence:.93};
    if(/\b(headline|title|copy|text|image|photo|video|product|service|portfolio|property|room|course|post|event)\b/.test(lower))return{mode:'modify',target:'content',operations:[...parseContentOperations(text)],confidence:.9};
    return{mode:'modify',target:'feature',operations:[],confidence:.72};
  }
  if(/\b(build|create|make)\b/.test(lower))return{mode:'build',target:'general',operations:[],confidence:.85};
  return{mode:'clarify',target:'general',operations:[],confidence:.45};
}
function parseDesignOperations(text){
  const ops=[],lower=text.toLowerCase(),color=colorFromText(text);
  const bgToken=lower.match(/(?:background|bg)[^.!?]{0,60}\b(black|white|red|blue|green|purple|violet|indigo|pink|orange|yellow|gray|grey|cyan|teal|lime|gold|brown)\b/);
  const bgColor=bgToken?COLOR_HEX[bgToken[1]]:null;
  if(color)ops.push({type:'design',patch:{colors:{primary:color,accent:color}}});
  if(bgColor)ops.push({type:'design',patch:{colors:{background:bgColor}}});
  if(/dark/.test(lower))ops.push({type:'design',patch:{colors:{background:'#0b1020',surface:'#111827',text:'#f8fafc',muted:'#94a3b8'}}});
  if(/light/.test(lower))ops.push({type:'design',patch:{colors:{background:'#f8fafc',surface:'#ffffff',text:'#0f172a',muted:'#64748b'}}});
  if(/round|rounded|radius/.test(lower)){const value=/\b(\d{1,2})px\b/.exec(lower);ops.push({type:'design',patch:{radius:{md:value?Number(value[1]):16}}})}
  if(/more compact|smaller spacing|tight spacing/.test(lower))ops.push({type:'design',patch:{spacing:{section:48,card:16}}});
  if(/more spacious|larger spacing|airy/.test(lower))ops.push({type:'design',patch:{spacing:{section:88,card:24}}});
  if(/minimal/.test(lower))ops.push({type:'design',patch:{style:'minimal'}});
  if(/bold|vibrant/.test(lower))ops.push({type:'design',patch:{style:'bold'}});
  if(/luxury|premium/.test(lower))ops.push({type:'design',patch:{style:'luxury'}});
  return ops;
}
function parseContentOperations(text){
  const lower=text.toLowerCase(),ops=[];
  const title=text.match(/(?:change|rename|set)\s+(?:the\s+)?(?:headline|title)\s+(?:to|as)\s+["']?(.+?)["']?$/i);
  if(title)ops.push({type:'content',collection:'pages',action:'set-title',value:clean(title[1],180)});
  const product=text.match(/(?:rename|change)\s+(?:the\s+)?product\s+(?:to|as)\s+["']?(.+?)["']?$/i);
  if(product)ops.push({type:'content',collection:'products',action:'rename-first',value:clean(product[1],180)});
  const image=text.match(/(?:use|set|make).*?(?:image|photo).*?(?:to|as)\s+["']?([^"']+?)["']?(?:$|\.)/i);
  if(image)ops.push({type:'content',collection:'products',action:'set-image-first',value:clean(image[1],1000)});
  if(/hero.*video|video.*hero/.test(lower))ops.push({type:'content',collection:'media',action:'bind-hero-video'});
  return ops;
}
function parseThreeOperations(text){
  const lower=text.toLowerCase(),ops=[];
  const color=colorFromText(text);
  if(color)ops.push({type:'content',collection:'products',action:'patch-first',patch:{customFields:{materialColor:color}}});
  if(/add .*hotspot/.test(lower)){
    const room=text.match(/hotspot[^a-z0-9]*(?:for|named|called)\s+([a-z0-9 _-]{2,50})/i)?.[1]||text.match(/add\s+(?:a|an)\s+([a-z0-9 _-]{2,50})\s+hotspot/i)?.[1]||'New area';
    ops.push({type:'content',collection:'scenes',action:'add-hotspot',value:clean(room,80)});
  }
  if(/slow cinematic|slow camera|cinematic tour/.test(lower))ops.push({type:'content',collection:'scenes',action:'camera-profile',profile:'slow-cinematic'});
  if(/fast camera|quick tour/.test(lower))ops.push({type:'content',collection:'scenes',action:'camera-profile',profile:'fast'});
  if(/floors*(?:plan|map)/.test(lower))ops.push({type:'content',collection:'properties',action:'ensure-floorplan'});
  if(/material|marble|wood|metal|glass/.test(lower)){const material=text.match(/\b(marble|wood|metal|glass|concrete|stone)\b/i)?.[1];if(material)ops.push({type:'content',collection:'scenes',action:'environment-material',value:material.toLowerCase()})}
  if(/lighting|brighter|darker/.test(lower))ops.push({type:'content',collection:'scenes',action:'lighting',value:/darker/.test(lower)?'low':'bright'});
  const asset=text.match(/(?:use|attach|set)\s+(?:the\s+)?asset\s+["']?([^"']+?)["']?\s+(?:as|for)\s+(model|image|video|poster|floorplan)/i)||text.match(/(?:use|attach|set)\s+["']?([^"']+?)["']?\s+(model|image|video|poster|floorplan)/i);
  if(asset)ops.push({type:'content',collection:'assets',action:'attach-first-match',name:clean(asset[1],180),mode:asset[2].toLowerCase()});
  return ops;
}
export function buildClarification(input,context={}){
  const text=clean(input,2000),lower=text.toLowerCase();
  if(!text)return{needsInput:true,question:'What would you like to build or change?',options:[
    {id:'website',label:'Website'},{id:'web-app',label:'Web app'},{id:'mobile',label:'Mobile app'},{id:'3d',label:'3D experience'}]};
  if(/^(make it better|improve it|fix it|do something|change it|make changes?)$/.test(lower)||lower.length<8)return{needsInput:true,question:'What should I change?',options:[
    {id:'visual',label:'Colors & design'},{id:'layout',label:'Layout & spacing'},{id:'content',label:'Text & media'},{id:'feature',label:'Add a feature'},{id:'3d',label:'3D scene'}]};
  if(/\b(build|create|make)\b/.test(lower)&&!/(website|web app|mobile|android|ios|desktop|saas|store|portfolio|dashboard|3d|pwa|apk)/.test(lower))return{needsInput:true,question:'What are you building?',options:[
    {id:'landing',label:'Landing website'},{id:'portfolio',label:'Portfolio'},{id:'web-app',label:'Web app'},{id:'store',label:'Online store'},{id:'3d',label:'3D experience'},{id:'apk',label:'Android APK'}]};
  if(context?.templateId&&lower.length<12)return{needsInput:true,question:'What would you like to customize in this template?',options:[
    {id:'brand',label:'Brand & colors'},{id:'content',label:'Content & images'},{id:'sections',label:'Sections'},{id:'features',label:'Features'}]};
  return{needsInput:false,question:'',options:[]};
}
export function buildPromptFromPlan(plan={}){
  const idea=clean(plan.idea||'website or app',1000),genre=clean(plan.genre||'business',100),platform=clean(plan.platform||'web',100),style=clean(plan.style||'modern',100),features=Array.isArray(plan.features)?plan.features.map(x=>clean(x,100)).slice(0,20):[];
  return `Build a production-ready ${idea}. Genre: ${genre}. Platform: ${platform}. Visual direction: ${style}. Include: ${features.join(', ')||'responsive design, accessibility, SEO, content editing, loading/empty/error/success states'}. Keep the core runtime provider-independent, make optional integrations graceful, and verify the result before release.`;
}
export function applyThreeCommand(content={},command=''){
  const out=JSON.parse(JSON.stringify(content||{})),classification=classifyAssistantRequest(command);
  const scene=(out.scenes||[])[0],product=(out.products||[])[0];
  if(!scene)out.scenes=[{id:'scene-1',title:'Main scene',hotspots:[],cameraPath:[]}];
  if(!out.products)out.products=[];
  const targetScene=out.scenes[0],targetProduct=out.products[0];
  for(const op of classification.operations||[]){
    if(op.collection==='scenes'&&op.action==='add-hotspot'){targetScene.hotspots=[...(targetScene.hotspots||[]),{id:'hotspot-'+Date.now().toString(36),label:op.value,room:op.value,position:{x:0,y:1.2,z:0}}];}
    if(op.collection==='scenes'&&op.action==='camera-profile'){targetScene.cameraPath=op.profile==='slow-cinematic'?[{x:12,y:6,z:14,duration:4},{x:-10,y:5,z:10,duration:4},{x:-8,y:4,z:-10,duration:4}]:[{x:12,y:6,z:14,duration:1.2},{x:-8,y:4,z:10,duration:1.2}];}
    if(op.collection==='scenes'&&op.action==='environment-material'){targetScene.environment={...(targetScene.environment||{}),material:op.value};}
    if(op.collection==='scenes'&&op.action==='lighting'){targetScene.environment={...(targetScene.environment||{}),lighting:op.value};}
    if(op.collection==='products'&&op.action==='patch-first'){if(!out.products.length)out.products.push({id:'product-1',title:'Product',customFields:{}});const p=out.products[0];p.customFields={...(p.customFields||{}),...(op.patch.customFields||{})};}
  }
  return{content:out,classification};
}
export function applyContentIntent(content={},operations=[]){
 const out=JSON.parse(JSON.stringify(content||{}));
 for(const op of operations||[]){
  const list=Array.isArray(out[op.collection])?out[op.collection]:[];
  if(op.action==='set-title'&&op.collection==='pages'){if(!list.length)list.push({id:'home',title:'Home',description:''});list[0].title=op.value;}
  if(op.action==='rename-first'&&list[0])list[0].title=op.value;
  if(op.action==='set-image-first'&&list[0])list[0].images=[op.value];
  if(op.action==='bind-hero-video')out.media=[...(out.media||[]),{id:'hero-video',type:'video',url:'',role:'hero'}];
  if(op.collection==='scenes'&&op.action==='add-hotspot'){if(!list[0])list.push({id:'scene-1',title:'Main scene',hotspots:[]});list[0].hotspots=[...(list[0].hotspots||[]),{id:'hotspot-'+Date.now().toString(36),label:op.value,room:op.value,position:{x:0,y:1.2,z:0}}];}
  if(op.collection==='scenes'&&op.action==='camera-profile'){if(!list[0])list.push({id:'scene-1',title:'Main scene'});list[0].cameraPath=op.profile==='slow-cinematic'?[{x:12,y:6,z:14,duration:4},{x:-10,y:5,z:10,duration:4},{x:-8,y:4,z:-10,duration:4}]:[{x:12,y:6,z:14,duration:1.2},{x:-8,y:4,z:10,duration:1.2}];}
  if(op.collection==='scenes'&&op.action==='environment-material'){if(!list[0])list.push({id:'scene-1',title:'Main scene'});list[0].environment={...(list[0].environment||{}),material:op.value};}
  if(op.collection==='scenes'&&op.action==='lighting'){if(!list[0])list.push({id:'scene-1',title:'Main scene'});list[0].environment={...(list[0].environment||{}),lighting:op.value};}
 }
 return out;
}
export {parseDesignOperations,parseContentOperations,parseThreeOperations};