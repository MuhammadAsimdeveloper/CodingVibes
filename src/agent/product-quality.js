import fs from 'node:fs';
import path from 'node:path';

const BASE_STATES=['loading','empty','error','success'];
const BASE_FEATURES=[
  'responsive UI',
  'accessible navigation and forms',
  'reduced-motion support',
  'SEO metadata and canonical URL',
  'local assets/runtime',
  'local content/data editing',
  'owner admin surface'
];

function walk(root,out=[]){
  if(!fs.existsSync(root)||out.length>=800)return out;
  for(const entry of fs.readdirSync(root,{withFileTypes:true})){
    if(['.git','node_modules','.codingvibes'].includes(entry.name))continue;
    const file=path.join(root,entry.name);
    if(entry.isDirectory())walk(file,out);
    else if(/\.(html|css|js|jsx|ts|tsx|json|md|svg|webmanifest)$/i.test(entry.name))out.push(file);
  }
  return out;
}

function readText(files){
  let result='';
  for(const file of files){
    try{result+=fs.readFileSync(file,'utf8')+'\n';}catch{}
  }
  return result.slice(0,1400000);
}

function htmlFiles(files){return files.filter(file=>file.toLowerCase().endsWith('.html'));}

function htmlText(files){
  return htmlFiles(files).map(file=>{try{return fs.readFileSync(file,'utf8');}catch{return'';}}).join('\n');
}

function unique(values){return [...new Set(values)];}
function hasAny(source,values){
  const text=String(source||'').toLowerCase();
  return values.some(value=>text.includes(String(value).toLowerCase()));
}

function defaultSurfaces(kind='business',behavior={}){
  const surfaces=['/','/privacy','/terms','/contact'];
  if(['business','local','agency','portfolio','hospitality','realEstate','education','event','content'].includes(kind))surfaces.push('/about');
  if(['portfolio','agency'].includes(kind))surfaces.push('/work');
  if(kind==='realEstate')surfaces.push('/properties');
  if(kind==='hospitality')surfaces.push('/booking','/calendar');
  if(kind==='education')surfaces.push('/courses');
  if(kind==='content')surfaces.push('/blog');
  if(kind==='event')surfaces.push('/schedule');
  if(['ecommerce','marketplace'].includes(kind))surfaces.push('/shop','/collections','/cart','/checkout','/account');
  if(kind==='marketplace')surfaces.push('/vendors');
  if(behavior.authentication||behavior.publicLogin)surfaces.push('/login','/signup');
  if(behavior.payments)surfaces.push('/checkout');
  return unique(surfaces);
}

export function buildQualityContract(spec={}){
  const kind=String(spec.siteKind||spec.contentModel?.kit||'business');
  const behavior=spec.behavior||{};
  const requiredSurfaces=unique([...(Array.isArray(spec.pages)?spec.pages:[]),...defaultSurfaces(kind,behavior)]);
  const requiredFeatures=[...BASE_FEATURES];
  if(behavior.search)requiredFeatures.push('search and filtering');
  if(behavior.catalog)requiredFeatures.push('catalog/product states');
  if(behavior.booking)requiredFeatures.push('booking/availability states');
  if(behavior.cms)requiredFeatures.push('draft/publish content workflow');
  if(behavior.realtime)requiredFeatures.push('realtime fallback');
  if(behavior.offline)requiredFeatures.push('offline/PWA fallback');
  if(behavior.notifications)requiredFeatures.push('notification permission/failure states');
  if(behavior.files)requiredFeatures.push('upload/download progress and failure states');
  if(behavior.camera)requiredFeatures.push('camera permission/error fallback');
  if(behavior.location)requiredFeatures.push('location permission/error fallback');
  if(spec.experience?.threeD)requiredFeatures.push('WebGL fallback','user-controlled immersive interactions');
  if(behavior.payments)requiredFeatures.push('provider-neutral checkout boundary');
  if(behavior.authentication)requiredFeatures.push('provider-neutral local authentication boundary');
  return {
    version:'quality-contract.v2',
    minimumScore:90,
    providerIndependent:true,
    requiredSurfaces,
    requiredStates:BASE_STATES,
    requiredFeatures:unique(requiredFeatures),
    hardRules:[
      'Core runtime does not require a remote script, stylesheet or external API',
      'Core interactions remain usable when optional effects or providers fail',
      'Forms expose labels and actionable errors',
      'Images expose alternatives unless decorative',
      'Public pages expose semantic metadata',
      'Responsive and reduced-motion behavior are explicit',
      'Never publish unsupported metrics or fabricated reviews, customer identities, ratings or logos',
      'Never use purple gradients, unwanted AI attribution, emoji icons or pill-shaped buttons',
      'Never add cursor-following animations or excessive scroll-linked motion',
      'Avoid vague marketing copy and em-dash punctuation'
    ]
  };
}

function publicRoutes(files){
  const routes=new Set(['/']);
  for(const file of htmlFiles(files)){
    const normalized=file.replace(/\\/g,'/');
    const rel=normalized.includes('/public/')?normalized.split('/public/').pop():path.basename(normalized);
    if(rel==='index.html')routes.add('/');
    else if(rel?.endsWith('.html'))routes.add('/'+rel.slice(0,-5));
  }
  return routes;
}

function linkIntegrity(html,spec,files){
  const routeSet=publicRoutes(files);
  const declared=new Set(Array.isArray(spec.pages)?spec.pages:['/']);
  const broken=[];
  for(const match of html.matchAll(/(?:href|data-route)=["'](\/[^"'#?]*)/gi)){
    const route=match[1].replace(/\/+$/,'')||'/';
    if(route.startsWith('/api/')||route.startsWith('/admin')||route.startsWith('/assets/')||route.startsWith('/_'))continue;
    if(!declared.has(route)&&!routeSet.has(route))broken.push(route);
  }
  return unique(broken);
}

function remoteImportCount(source){
  return (String(source||'').match(/@import\s+(?:url\()?["']?https?:\/\//gi)||[]).length;
}

function nativeEntrypointExists(target,names){
  const checks={
    'mobile-expo':names.includes('app.tsx'),
    'mobile-flutter':names.includes('lib/main.dart'),
    'android-kotlin':names.some(name=>name.endsWith('/mainactivity.kt')||name==='mainactivity.kt'),
    'android-twa':names.some(name=>name.endsWith('/androidmanifest.xml')),
    'ios-swiftui':names.includes('sources/app/app.swift'),
    'desktop-electron':names.includes('src/index.html'),
    'desktop-tauri':names.includes('src/index.html'),
    'multiplatform-kmp':names.some(name=>name.endsWith('/commonmain/kotlin/app.kt'))
  };
  return checks[target]!==false;
}

function purpleHueFromHex(raw){
  let hex=String(raw||'').replace(/^#/,'');
  if(hex.length===3)hex=hex.split('').map(ch=>ch+ch).join('');
  if(!/^[0-9a-f]{6}$/i.test(hex))return null;
  const rgb=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255);
  const max=Math.max(...rgb),min=Math.min(...rgb),delta=max-min;
  if(delta===0)return{hue:0,saturation:0};
  let hue;
  if(max===rgb[0])hue=60*(((rgb[1]-rgb[2])/delta)%6);
  else if(max===rgb[1])hue=60*((rgb[2]-rgb[0])/delta+2);
  else hue=60*((rgb[0]-rgb[1])/delta+4);
  if(hue<0)hue+=360;
  const saturation=max===0?0:delta/max;
  return{hue,saturation};
}

function hasPurpleGradient(source){
  const text=String(source||'');
  if(/\b(?:from|via|to)-(?:purple|violet|fuchsia)-\d{2,3}\b/i.test(text))return true;
  const gradients=text.match(/(?:linear|radial|conic)-gradient\s*\([^)]{0,1000}\)/gi)||[];
  return gradients.some(gradient=>{
    if(/\b(?:purple|violet|fuchsia)\b/i.test(gradient))return true;
    const colors=[...gradient.matchAll(/#([0-9a-f]{3}|[0-9a-f]{6})\b/gi)];
    return colors.some(match=>{
      const value=purpleHueFromHex(match[1]);
      return Boolean(value&&value.hue>=250&&value.hue<=320&&value.saturation>=0.25);
    });
  });
}

function socialProofClaims(source){
  const text=String(source||'');
  const patterns=[
    /\b(?:trusted by|loved by)\s+(?:over\s+)?[\d,.]+\s*(?:\+|k|m|thousand|million)?\s*(?:users|customers|teams|businesses|companies)\b/gi,
    /\b[\d,.]+\s*(?:k|m|thousand|million)?\s*(?:happy customers|five[- ]star reviews|5[- ]star reviews)\b/gi,
    /\b(?:fake|sample|placeholder|demo)\s+(?:customer\s+)?(?:review|testimonial|rating)s?\b/gi,
    /\b(?:Jane Doe|John Smith)\b/gi
  ];
  const claims=[];
  for(const pattern of patterns)for(const match of text.matchAll(pattern))claims.push(match[0]);
  return unique(claims);
}

function hasEmojiIcon(html){
  return /<(?:button|a)\b[^>]*>(?:(?!<\/(?:button|a)>)[\s\S]){0,240}?\p{Extended_Pictographic}[\s\S]{0,120}?<\/(?:button|a)>/iu.test(String(html||''));
}

export function auditProductExperience(workspace,spec={}){
  const root=path.resolve(workspace);
  const files=walk(root);
  const names=files.map(file=>path.relative(root,file).replaceAll(path.sep,'/').toLowerCase());
  const source=readText(files);
  const html=htmlText(files);
  const contract=buildQualityContract(spec);
  const webTarget=['web-node','web-pwa'].includes(String(spec.target?.id||'web-node'));
  const checks=[];
  let brokenLinks=[];
  const addCheck=(id,label,ok,blocking=false,detail='')=>checks.push({id,label,passed:Boolean(ok),blocking:Boolean(blocking&&!ok),detail});

  if(webTarget){
    const entry=names.includes('public/index.html')||names.includes('index.html');
    addCheck('core_entrypoint','core entrypoint',entry,true);
    addCheck('semantic_structure','semantic HTML structure',
      /<html\b[^>]*\blang=["'][^"']+["'][^>]*>/i.test(html)&&/<main\b/i.test(html)&&/<nav\b/i.test(html),true);
    addCheck('responsive_layout','responsive layout',
      /<meta[^>]+name=["']viewport["']/i.test(html)||/@media\b|clamp\(/i.test(source),true);
    addCheck('accessible_focus','keyboard focus support',/focus-visible|:focus\s*\{|aria-|role=/i.test(source),true);
    addCheck('reduced_motion','reduced-motion support',/prefers-reduced-motion|reducedMotion/i.test(source),true);
    addCheck('metadata','public metadata',
      /<meta[^>]+name=["']description["']/i.test(html)&&/<link[^>]+rel=["']canonical["']/i.test(html)&&/<meta[^>]+property=["']og:/i.test(html));
    addCheck('semantic_navigation','semantic navigation',/<nav\b/i.test(html)&&/<a\b[^>]+href=/i.test(html));
    addCheck('interaction_states','interaction states',/loading|empty|error|success|disabled|aria-busy|:active|:focus/i.test(source));
    const labels=new Set([...html.matchAll(/<label\b[^>]*\bfor=["']([^"']+)["'][^>]*>/gi)].map(match=>match[1]));
    const controls=[...html.matchAll(/<(input|select|textarea)\b([^>]*)>/gi)].filter(match=>!/\btype\s*=\s*["']hidden["']/i.test(match[2]));
    const unlabeled=controls.filter(match=>{
      const attrs=match[2];
      if(/\baria-label\s*=|\baria-labelledby\s*=/i.test(attrs))return false;
      const id=(attrs.match(/\bid\s*=\s*["']([^"']+)["']/i)||[])[1];
      const start=match.index||0;
      const before=html.slice(0,start);
      const wrapped=before.lastIndexOf('<label')>before.lastIndexOf('</label>')&&html.indexOf('</label>',start)>=0;
      return !wrapped&&(!id||!labels.has(id));
    });
    addCheck('form_label_missing','form control labels',unlabeled.length===0,true,unlabeled.length?String(unlabeled.length):'');
    const badImages=[...html.matchAll(/<img\b([^>]*)>/gi)].filter(match=>!(/\balt\s*=\s*["'][^"']*["']/i.test(match[1])||/\brole\s*=\s*["']presentation["']/i.test(match[1])));
    addCheck('image_alt_missing','image alternative text',badImages.length===0,true,badImages.length?String(badImages.length):'');
    const remoteRuntime=[...source.matchAll(/<(?:script|link)\b[^>]*(?:src|href)=["']https?:\/\/[^"']+["'][^>]*>/gi)];
    addCheck('remote_runtime_dependency','provider-independent runtime',remoteRuntime.length===0&&remoteImportCount(source)===0,true,remoteRuntime.length?String(remoteRuntime.length):'');
    addCheck('launch_surfaces','launch surfaces',hasAny(source,['contact','privacy','terms','sitemap','robots']));
    addCheck('placeholder_content','no obvious placeholder copy',!/(lorem ipsum|todo:|coming soon|replace this text)/i.test(html));
    brokenLinks=linkIntegrity(html,spec,files);
    addCheck('internal_links','internal links resolve',brokenLinks.length===0,false,brokenLinks.slice(0,12).join(', '));
    if(String(spec.target?.id||'web-node')==='web-pwa'){
      addCheck('pwa_surface','PWA manifest and service worker',names.includes('public/manifest.webmanifest')&&names.includes('public/sw.js'));
    }
    if(spec.experience?.threeD){
      addCheck('3d_fallback','3D fallback',hasAny(source,['webgl','canvas','fallback','no 3d']),true);
    }
  }else{
    const target=String(spec.target?.id||'web-node');
    addCheck('target_entrypoint','target entrypoint',nativeEntrypointExists(target,names),true);
    addCheck('local_runtime','provider-independent target runtime',
      !/<(?:script|link)\b[^>]*(?:src|href)=["']https?:\/\//i.test(source),true);
    addCheck('app_navigation','application navigation shell',hasAny(source,['Home','Explore','Profile','Settings','Calendar','NavigationBar','TabView','nav']));
    addCheck('app_action_state','application action/state feedback',hasAny(source,['Get started','Saved locally','Saved','Loading','Error','empty']));
  }

  const approvedClaims=new Set((Array.isArray(spec.verifiedSocialProof)?spec.verifiedSocialProof:[]).map(value=>String(value).trim().toLowerCase()));
  const claims=socialProofClaims(html);
  const unverifiedClaims=claims.filter(claim=>!approvedClaims.has(claim.toLowerCase()));
  addCheck('unwanted_ai_attribution','no unwanted AI attribution',!(/made\s+with\s+(?:generative\s+)?ai/i.test(html)),true);
  addCheck('purple_gradient','no purple gradients',!hasPurpleGradient(source),true);
  addCheck('fabricated_social_proof','customer proof has evidence',unverifiedClaims.length===0,true,unverifiedClaims.slice(0,5).join('; '));
  addCheck('emoji_ui_icon','no emoji used as interface icons',!hasEmojiIcon(html),true);
  addCheck('em_dash_copy','copy avoids em dashes',!html.includes('\u2014'),true);
  addCheck('pill_button_style','buttons are not forced into pill shapes',!(/<(?:button|Button)\b[^>]*(?:rounded-full|rounded-pill|pill-button)[^>]*>/i.test(source)||/button\s*\{[^}]*border-radius\s*:\s*(?:9999?px|50%)/i.test(source)),true);
  addCheck('custom_cursor_animation','no cursor-following animation',!(/cursor[-_ ]?(?:follower|trail|glow)|customCursor|cursorFollower|--mx\s*:|--my\s*:|cursor\s*:\s*none\b/i.test(source)),true);
  addCheck('excessive_scroll_motion','scroll motion is restrained',!(/ScrollTrigger|scroll-timeline|data-scroll-(?:speed|position)|camera-story|scroll\s*:\s*['"]story['"]|parallax\s*:\s*true/i.test(source)),true);
  addCheck('vague_marketing_copy','copy is specific rather than vague',!(/revolutioniz(?:e|es|ing)|cutting.edge|world.class|seamless experience|next.level solution|game.changing/i.test(html)),true);

  const required=contract.requiredFeatures;
  if(required.includes('search and filtering'))addCheck('feature_search','search and filtering',hasAny(source,['search','filter']));
  if(required.includes('provider-neutral checkout boundary'))addCheck('feature_checkout','provider-neutral checkout',hasAny(source,['checkout','payment']));
  if(required.includes('provider-neutral local authentication boundary'))addCheck('feature_auth','provider-neutral authentication',hasAny(source,['login','sign in','session','auth']));
  if(required.includes('booking/availability states'))addCheck('feature_booking','booking and availability',hasAny(source,['booking','appointment','calendar','availability']));

  const passed=checks.filter(check=>check.passed).length;
  const totalWeight=checks.reduce((sum,check)=>sum+(check.blocking?10:5),0);
  const earnedWeight=checks.filter(check=>check.passed).reduce((sum,check)=>sum+(check.blocking?10:5),0);
  const score=Math.max(60,Math.round((earnedWeight/Math.max(1,totalWeight))*100));
  const blockingFindings=checks.filter(check=>check.blocking).map(check=>({
    id:check.id,label:check.label,detail:check.detail,message:check.label+' is missing or unsafe.'
  }));
  const warnings=checks.filter(check=>!check.passed&&!check.blocking).map(check=>({
    id:check.id,label:check.label,detail:check.detail,message:check.label+' needs improvement.'
  }));
  return {
    version:'product-quality.v2',
    score,minimumScore:contract.minimumScore,passed,total:checks.length,checks,
    missing:checks.filter(check=>!check.passed).map(check=>check.label),
    blockingFindings,warnings,
    releaseReady:blockingFindings.length===0&&score>=contract.minimumScore,
    portable:true,
    providerIndependent:!blockingFindings.some(check=>check.id==='remote_runtime_dependency'),
    qualityContract:contract,
    internalLinkIssues:brokenLinks
  };
}
