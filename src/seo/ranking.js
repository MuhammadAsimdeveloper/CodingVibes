const ROBOTS_TOKENS=new Set(['index','noindex','follow','nofollow','noarchive','nosnippet','notranslate','noimageindex','max-image-preview:large','max-snippet:-1','max-video-preview:-1']);
const INTENTS=new Set(['informational','commercial','transactional','navigational','local','mixed']);
const GRADE=(score)=>score>=90?'A':score>=80?'B':score>=70?'C':score>=60?'D':'F';
const clean=(value,max=4000)=>String(value??'').replace(/[\\u0000-\\u001f\\u007f]/g,' ').replace(/\\s+/g,' ').trim().slice(0,max);
const normalizePath=value=>{
  const raw=String(value||'/').trim();
  if(!raw||raw==='/' )return '/';
  const path=raw.startsWith('/')?raw:'/'+raw;
  return path.replace(/\\/+$/,'')||'/';
};
const validHttp=url=>{try{const u=new URL(String(url));return u.protocol==='http:'||u.protocol==='https:'?u:null}catch{return null}};
const unique=xs=>[...new Set(xs.filter(Boolean))];

export function normalizeSeoRoute(input={},baseUrl=''){
  const path=normalizePath(input.path);
  const base=validHttp(baseUrl);
  const title=clean(input.title,60);
  const description=clean(input.description,160);
  const rawCanonical=String(input.canonical||'').trim();
  let canonical=rawCanonical;
  if(!canonical) canonical=base?new URL(path,base.origin).toString():path;
  else if(canonical.startsWith('/')){
    canonical=base?new URL(canonical,base.origin).toString():canonical;
  } else {
    const parsed=validHttp(canonical);
    if(!parsed)throw new Error('unsafe_canonical');
  }
  const robotsInput=String(input.robots||'index,follow').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
  if(robotsInput.some(x=>!ROBOTS_TOKENS.has(x)))throw new Error('invalid_robots_directive');
  const robots=unique(robotsInput).join(',');
  const hreflang=Array.isArray(input.hreflang)?input.hreflang.slice(0,20).map(item=>{
    const lang=clean(item?.lang||item?.hreflang,20).toLowerCase();
    const url=String(item?.url||'').trim();
    const parsed=validHttp(url)||(/^//.test(url)&&base?new URL(url,base.origin):null);
    if(!lang||!parsed) return null;
    return {lang,url:parsed.toString()};
  }).filter(Boolean):[];
  const topics=unique((Array.isArray(input.topics)?input.topics:[]).map(x=>clean(x,80).toLowerCase())).slice(0,12);
  const focusTopic=clean(input.focusTopic||topics[0]||'',120).toLowerCase();
  const searchIntent=INTENTS.has(String(input.searchIntent||'').toLowerCase())?String(input.searchIntent).toLowerCase():'mixed';
  return {
    path,title,description,canonical,robots,
    focusTopic,topics,searchIntent,
    ogImage:clean(input.ogImage||input.image,2000),
    ogType:clean(input.ogType||'website',40).toLowerCase(),
    author:clean(input.author,160),
    publisher:clean(input.publisher,160),
    publishedAt:clean(input.publishedAt,40),
    modifiedAt:clean(input.modifiedAt,40),
    hreflang,
    noindex:/\\bnoindex\\b/i.test(robots)
  };
}

const score=(points,max,id)=>({id,points,max});
function clampScore(n){return Math.max(0,Math.min(100,Math.round(n)));}

export function scoreSeoRoute(input={}){
  const page=normalizeSeoRoute(input,input.baseUrl||'');
  const reasons=[];
  const checks=[];
  let total=0;
  const add=(section)=>{total+=section.points;checks.push({...section});if(section.reasons.length)reasons.push(...section.reasons);};

  let metadata=0;
  if(page.title.length>=30&&page.title.length<=60)metadata+=6;
  else if(page.title.length>=10)metadata+=3; else reasons.push('Write a descriptive title of roughly 30–60 characters.');
  if(page.description.length>=70&&page.description.length<=160)metadata+=5;
  else if(page.description.length>=50)metadata+=3; else reasons.push('Write a specific meta description that accurately summarizes the page.');
  if(validHttp(page.canonical))metadata+=4; else reasons.push('Use an absolute canonical URL.');
  if(page.ogImage)metadata+=3; else reasons.push('Add a social preview image for stronger share presentation.');
  add(score(metadata,20,'metadata'));

  let indexability=0;
  if(!page.noindex)indexability+=7;
  else reasons.push('This route is noindex; keep that intentional for private, duplicate or utility pages.');
  if(page.robots.includes('follow')&&!page.robots.includes('nofollow'))indexability+=3;
  if(input.inSitemap===true)indexability+=5; else reasons.push('Add the canonical public route to the XML sitemap.');
  add(score(indexability,15,'indexability'));

  let content=0;
  if(input.h1Count===1)content+=5; else reasons.push('Use exactly one clear primary H1.');
  if(Number(input.wordCount)>=700)content+=5;
  else if(Number(input.wordCount)>=400)content+=3;
  else reasons.push('Avoid thin pages; add genuinely useful information that fulfills the search intent.');
  if(Number(input.content?.uniqueRatio||0)>=0.9)content+=3;
  else if(Number(input.content?.uniqueRatio||0)>=0.75)content+=2;
  else reasons.push('Increase original, page-specific content instead of repeating near-duplicate copy.');
  if(input.content?.hasAnswerSummary)content+=2; else reasons.push('Add a concise answer-oriented summary near the top when appropriate.');
  if(input.content?.hasAuthor)content+=2;
  if(input.content?.hasUpdatedAt)content+=1;
  add(score(content,20,'content'));

  let links=0;
  if(Number(input.internalLinks)>=4)links+=7;
  else if(Number(input.internalLinks)>=2)links+=4;
  else reasons.push('Strengthen contextual internal linking.');
  if(Number(input.inboundLinks)>=2)links+=3;
  else if(Number(input.inboundLinks)>=1)links+=2;
  else reasons.push('Grow legitimate inbound references; this is an off-site authority signal, not a page-template feature.');
  if(input.orphan===false)links+=5; else reasons.push('Connect this page from the site information architecture; orphan pages are harder to discover.');
  add(score(links,15,'links'));

  let structured=0;
  if(input.structuredData?.valid)structured+=10; else reasons.push('Use valid structured data only when it accurately describes visible content.');
  const schemaTypes=Array.isArray(input.structuredData?.types)?input.structuredData.types:[];
  if(schemaTypes.includes('WebPage')||schemaTypes.includes('WebSite'))structured+=3;
  if(schemaTypes.length>=2)structured+=2;
  add(score(structured,15,'structured-data'));

  let media=0;
  const images=input.images||{};
  if(Number(images.missingAlt||0)===0)media+=3; else reasons.push('Provide descriptive alt text for meaningful images and empty alt for decorative images.');
  if(Number(images.count||0)===0||Number(images.missingDimensions||0)===0)media+=2;
  else reasons.push('Declare image dimensions to reduce layout instability.');
  add(score(media,5,'media'));

  let performance=0;
  const perf=input.performance||{};
  if(Number.isFinite(Number(perf.transferBytes))&&Number(perf.transferBytes)<=800000)performance+=3; else reasons.push('Measure and reduce initial transfer size.');
  if(Number.isFinite(Number(perf.jsBytes))&&Number(perf.jsBytes)<=200000)performance+=2; else reasons.push('Measure and reduce JavaScript shipped on the critical path.');
  if(Number.isFinite(Number(perf.lcpMs))&&Number(perf.lcpMs)<=2500)performance+=2; else reasons.push('Measure and improve Largest Contentful Paint.');
  if(Number.isFinite(Number(perf.cls))&&Number(perf.cls)<=0.1)performance+=1; else reasons.push('Measure and reduce layout shifts.');
  if(Number.isFinite(Number(perf.inpMs))&&Number(perf.inpMs)<=200)performance+=2; else reasons.push('Measure and reduce interaction latency.');
  add(score(performance,10,'performance'));

  const result={score:clampScore(total),grade:GRADE(clampScore(total)),rankingClaim:false,route:page.path,breakdown:checks,recommendations:unique(reasons).slice(0,20)};
  return result;
}

export function auditSeoSite({baseUrl='',pages=[],sitemapUrls=[]}={}){
  const normalized=pages.map(x=>normalizeSeoRoute(x,baseUrl));
  const publicPages=normalized.filter(p=>!p.noindex);
  const byPath=new Map(normalized.map(p=>[p.path,p]));
  const inbound=new Map(normalized.map(p=>[p.path,0]));
  const issues=[];
  const titles=new Map(),descriptions=new Map(),canonicals=new Map();
  for(const page of publicPages){
    if(page.title){const arr=titles.get(page.title)||[];arr.push(page.path);titles.set(page.title,arr);}
    if(page.description){const arr=descriptions.get(page.description)||[];arr.push(page.path);descriptions.set(page.description,arr);}
    if(page.canonical){const arr=canonicals.get(page.canonical)||[];arr.push(page.path);canonicals.set(page.canonical,arr);}
    for(const href of Array.isArray(page.internalLinks)?page.internalLinks:[]){
      const target=normalizePath(String(href).split(/[?#]/,1)[0]);
      if(!target)continue;
      if(byPath.has(target))inbound.set(target,(inbound.get(target)||0)+1);
      else issues.push({code:'broken_internal_link',path:page.path,target});
    }
  }
  for(const [title,paths] of titles)if(paths.length>1)issues.push({code:'duplicate_title',value:title,paths});
  for(const [description,paths] of descriptions)if(paths.length>1)issues.push({code:'duplicate_description',value:description,paths});
  for(const [canonical,paths] of canonicals)if(paths.length>1)issues.push({code:'canonical_conflict',value:canonical,paths});
  const sitemap=new Set((Array.isArray(sitemapUrls)?sitemapUrls:[]).map(String).map(u=>{if(u.startsWith('__SITE_URL__'))return normalizePath(u.slice('__SITE_URL__'.length));try{return new URL(u,baseUrl||undefined).pathname}catch{return normalizePath(u)}}));
  for(const page of publicPages){
    if(!sitemap.has(page.path))issues.push({code:'sitemap_missing',path:page.path});
    if(page.path!=='/'&&(inbound.get(page.path)||0)===0)issues.push({code:'orphan_page',path:page.path});
  }
  const pageScores=normalized.map(page=>scoreSeoRoute({...page,inSitemap:sitemap.has(page.path),inboundLinks:inbound.get(page.path)||0,orphan:page.path!=='/'&&(inbound.get(page.path)||0)===0}));
  const average=pageScores.length?pageScores.reduce((sum,x)=>sum+x.score,0)/pageScores.length:0;
  const penalty=Math.min(25,issues.length*4);
  const finalScore=clampScore(average-penalty);
  return {
    ok:issues.length===0&&pageScores.every(x=>x.score>=70),
    score:finalScore,
    grade:GRADE(finalScore),
    rankingClaim:false,
    issues,
    warnings:pageScores.flatMap(x=>x.recommendations.map(r=>({code:'page_recommendation',path:x.route,message:r}))).slice(0,50),
    pages:pageScores,
    checkedAt:new Date().toISOString()
  };
}

export function buildTopicPlan({primary='',supporting=[],intent='mixed'}={}){
  const primaryTopic=clean(primary,120).toLowerCase();
  const supportingTopics=unique((Array.isArray(supporting)?supporting:[]).map(x=>clean(x,80).toLowerCase()).filter(Boolean).filter(x=>x!==primaryTopic)).slice(0,12);
  return {
    primaryTopic,
    supportingTopics,
    intent:INTENTS.has(String(intent).toLowerCase())?String(intent).toLowerCase():'mixed',
    useInMetaKeywords:false,
    guidance:[
      'Use the primary topic where it naturally clarifies page intent.',
      'Use supporting topics in useful headings, copy and internal links when they genuinely belong.',
      'Do not create mass keyword permutations or keyword-stuffed metadata.'
    ]
  };
}
