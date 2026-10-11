import {baselinePath,comparePng,visualArtifactName} from './visual.js';
import {runTool} from '../tool-fabric/index.js';


export function normalizeBrowserPerformanceMetrics({navigation={},resources=[],paintEntries=[],vitals={}}={}) {
  const validNumber=value=>value!==undefined&&value!==null&&Number.isFinite(Number(value))&&Number(value)>=0;
  const sizeOf=resource=>validNumber(resource?.transferSize)?Number(resource.transferSize):null;
  const encodedOf=resource=>validNumber(resource?.encodedBodySize)?Number(resource.encodedBodySize):null;
  const nameOf=resource=>String(resource?.name||'');
  const isJavaScript=resource=>String(resource?.initiatorType||'').toLowerCase()==='script'||/\.(?:m?js|cjs)(?:[?#]|$)/iu.test(nameOf(resource));
  const isImage=resource=>String(resource?.initiatorType||'').toLowerCase()==='img'||/\.(?:png|jpe?g|webp|gif|avif|svg|ico)(?:[?#]|$)/iu.test(nameOf(resource));
  const resourceList=Array.isArray(resources)?resources:[];
  const knownBytes=resource=> {
    const transfer=sizeOf(resource), encoded=encodedOf(resource);
    if(transfer===null)return false;
    if(transfer===0&&encoded===0&&!/^(?:data|blob):/iu.test(nameOf(resource)))return false;
    return true;
  };
  const allResourceBytesKnown=resourceList.length>0&&resourceList.every(knownBytes);
  const sumTransfer=items=>items.reduce((total,item)=>total+(sizeOf(item)??0),0);
  const opaqueJavaScript=resourceList.some(resource=>isJavaScript(resource)&&!knownBytes(resource));
  const opaqueImages=resourceList.some(resource=>isImage(resource)&&!knownBytes(resource));
  const fcp=Array.isArray(paintEntries)?paintEntries.find(entry=>entry?.name==='first-contentful-paint'):null;
  const navNumber=key=>validNumber(navigation?.[key])?Number(navigation[key]):null;
  const requestStart=navNumber('requestStart'), responseStart=navNumber('responseStart');
  const metricsForAudit={};
  if(vitals?.lcpObserved===true&&validNumber(vitals.lcpMs))metricsForAudit.lcpMs=Number(vitals.lcpMs);
  if(vitals?.clsObserved===true&&validNumber(vitals.cls))metricsForAudit.cls=Number(vitals.cls);
  if(requestStart!==null&&responseStart!==null&&responseStart>=requestStart)metricsForAudit.ttfbMs=responseStart-requestStart;
  if(allResourceBytesKnown)metricsForAudit.totalBytes=sumTransfer(resourceList);
  if(allResourceBytesKnown&&!opaqueJavaScript)metricsForAudit.jsBytes=sumTransfer(resourceList.filter(isJavaScript));
  if(allResourceBytesKnown&&!opaqueImages)metricsForAudit.imageBytes=sumTransfer(resourceList.filter(isImage));
  const renderBlockingKnown=resourceList.length>0&&resourceList.every(resource=>typeof resource?.renderBlockingStatus==='string');
  if(renderBlockingKnown)metricsForAudit.blockingRequests=resourceList.filter(resource=>resource.renderBlockingStatus==='blocking').length;
  if(vitals?.inpObserved===true&&validNumber(vitals.inpMs))metricsForAudit.inpMs=Number(vitals.inpMs);
  const expected=['lcpMs','inpMs','cls','ttfbMs','totalBytes','jsBytes','imageBytes','blockingRequests'];
  const missingForAudit=expected.filter(key=>metricsForAudit[key]===undefined);
  const measurementStatus=Object.keys(metricsForAudit).length===0?'NEEDS_BROWSER_METRICS':missingForAudit.length?'PARTIAL_MEASURED':'MEASURED_COMPLETE';
  return {
    navigationDurationMs:navNumber('duration')??0,
    domContentLoadedMs:navNumber('domContentLoadedEventEnd')??0,
    firstContentfulPaintMs:fcp&&validNumber(fcp.startTime)?Number(fcp.startTime):null,
    transferBytes:sumTransfer(resourceList),
    lcpMs:metricsForAudit.lcpMs??null,
    cls:metricsForAudit.cls??null,
    ttfbMs:metricsForAudit.ttfbMs??null,
    totalBytes:metricsForAudit.totalBytes??null,
    jsBytes:metricsForAudit.jsBytes??null,
    imageBytes:metricsForAudit.imageBytes??null,
    blockingRequests:metricsForAudit.blockingRequests??null,
    inpMs:metricsForAudit.inpMs??null,
    interactionCount:Number.isSafeInteger(vitals?.interactionCount)&&vitals.interactionCount>=0?vitals.interactionCount:0,
    observedInteractionDurationMs:validNumber(vitals?.interactionDurationMs)?Number(vitals.interactionDurationMs):null,
    resourceBytesComplete:allResourceBytesKnown,
    metricsForAudit,
    missingForAudit,
    measurementStatus,
    measurementNotes:missingForAudit.includes('inpMs')?'INP was not inferred from a navigation-only smoke test; provide a real interaction or Lighthouse measurement.':''
  };
}

export function assessResponsiveLayout({viewportWidth,documentWidth,bodyWidth,overflowingElements=[]}={}) {
  const valid=value=>Number.isFinite(Number(value))&&Number(value)>0;
  const failures=[];
  if(!valid(viewportWidth)||!valid(documentWidth)||!valid(bodyWidth))failures.push('valid viewport measurements are required');
  const viewport=valid(viewportWidth)?Number(viewportWidth):0;
  const document=valid(documentWidth)?Number(documentWidth):0;
  const body=valid(bodyWidth)?Number(bodyWidth):0;
  const horizontalOverflowPx=Math.max(0,document-viewport,body-viewport);
  if(horizontalOverflowPx>2)failures.push(`horizontal overflow of ${Math.ceil(horizontalOverflowPx)}px at ${viewport}px viewport`);
  return {ok:failures.length===0,viewportWidth:viewport,documentWidth:document,bodyWidth:body,horizontalOverflowPx,overflowingElements:Array.isArray(overflowingElements)?overflowingElements.slice(0,5).map(String):[],failures};
}

export function assessAccessibilitySemantics({imagesMissingAlt=0,controlsWithoutName=0,linksWithoutName=0,formControlsWithoutName=0,interactiveAriaHidden=0,headingLevels=[],smallTouchTargets=[]}={}){
  const failures=[];
  if(Number(imagesMissingAlt)>0)failures.push(`${Number(imagesMissingAlt)} image(s) missing an alt attribute`);
  if(Number(controlsWithoutName)>0)failures.push(`${Number(controlsWithoutName)} control(s) without accessible name`);
  if(Number(linksWithoutName)>0)failures.push(`${Number(linksWithoutName)} link(s) without accessible name`);
  if(Number(formControlsWithoutName)>0)failures.push(`${Number(formControlsWithoutName)} form field(s) without accessible name`);
  if(Number(interactiveAriaHidden)>0)failures.push(`${Number(interactiveAriaHidden)} interactive element(s) incorrectly aria-hidden`);
  if(Array.isArray(smallTouchTargets)&&smallTouchTargets.length)failures.push(`${smallTouchTargets.length} primary interactive target(s) are below minimum target dimensions`);
  const levels=Array.isArray(headingLevels)?headingLevels.map(Number).filter(level=>Number.isInteger(level)&&level>=1&&level<=6):[];
  const h1Count=levels.filter(level=>level===1).length;
  if(h1Count!==1)failures.push(`expected one H1 heading, found ${h1Count}`);
  for(let i=0;i<levels.length;i++){
    if(i===0&&levels[i]>1){failures.push(`heading hierarchy starts at H${levels[i]}`);break;}
    if(i>0&&levels[i]>levels[i-1]+1){failures.push(`heading hierarchy skips from H${levels[i-1]} to H${levels[i]}`);break;}
  }
  return {ok:failures.length===0,failures,h1Count,headingLevels:levels};
}

export function assessTextContrast(samples=[]){
  const failures=[];
  const checked=[];
  const skipped=[];
  for(const sample of Array.isArray(samples)?samples.slice(0,100):[]){
    const ratio=Number(sample?.ratio);
    const minimum=Number(sample?.minimum??4.5);
    if(sample?.skippedReason){skipped.push({text:String(sample.text||'').slice(0,100),reason:String(sample.skippedReason).slice(0,80)});continue;}
    if(!Number.isFinite(ratio)||ratio<1||ratio>21){skipped.push({text:String(sample?.text||'').slice(0,100),reason:'contrast_ratio_unavailable'});continue;}
    const entry={text:String(sample.text||'').replace(/\s+/g,' ').trim().slice(0,100),ratio:Number(ratio.toFixed(2)),minimum};
    checked.push(entry);
    if(ratio+0.01<minimum)failures.push(`text contrast ${entry.ratio}:1 is below ${minimum}:1 for "${entry.text}"`);
  }
  return {ok:failures.length===0,failures,checkedCount:checked.length,skippedCount:skipped.length,checked:checked.slice(0,20),skipped:skipped.slice(0,10)};
}

export function assessBrowserQuality(result,{maxLoadMs=5000,maxTransferBytes=8_000_000}={}){
  const failures=[];
  if(result.error)failures.push(result.error);
  if(!(result.status>=200&&result.status<400))failures.push(`unexpected HTTP status ${result.status||0}`);
  if(result.consoleErrors?.length)failures.push(`${result.consoleErrors.length} console error(s)`);
  if(result.requestFailures?.length)failures.push(`${result.requestFailures.length} request failure(s)`);
  if(result.responseFailures?.length)failures.push(`${result.responseFailures.length} server error response(s)`);
  failures.push(...(result.uiFailures||[]));
  if(result.visual&&result.visual.passed===false)failures.push('visual regression threshold exceeded');
  if(Number(result.performance?.navigationDurationMs||0)>maxLoadMs)failures.push(`navigation took ${Math.round(result.performance.navigationDurationMs)}ms (max ${maxLoadMs}ms)`);
  if(Number(result.performance?.transferBytes||0)>maxTransferBytes)failures.push(`page transfer was ${result.performance.transferBytes} bytes (max ${maxTransferBytes})`);
  if(result.accessibility?.keyboard?.focusableCount>0&&!result.accessibility.keyboard.firstTabFocused)failures.push('first keyboard Tab did not move focus to an interactive element');
  if(result.accessibility?.keyboard?.firstTabFocused&&result.accessibility.keyboard.focusIndicatorVisible===false)failures.push('keyboard focus indicator is not visibly styled');
  return{ok:failures.length===0,failures};
}

export async function browserSmoke(baseUrl,paths,{screenshots=false,artifactDir='artifacts',baselineDir='',viewport={width:1440,height:900},responsiveViewports=[{width:375,height:812},{width:768,height:1024},{width:1440,height:900}],visualThreshold,pixelThreshold,analytics={},maxLoadMs=Number(process.env.CODINGVIBES_BROWSER_MAX_LOAD_MS||5000),maxTransferBytes=Number(process.env.CODINGVIBES_BROWSER_MAX_TRANSFER_BYTES||8_000_000)}={}){
 let pw;try{pw=await import('playwright');}catch{return{enabled:true,available:false,passed:false,skipped:'playwright not installed',results:[]};}
 const fs=await import('node:fs');fs.mkdirSync(artifactDir,{recursive:true});const browser=await pw.chromium.launch({headless:true});const results=[];
 try{
  for(const p of paths){
   const page=await browser.newPage({viewport});
   await page.addInitScript(()=>{
     const vitals={lcpObserved:false,lcpMs:null,clsObserved:false,cls:0,inpObserved:false,inpMs:null,interactionCount:0,interactionDurationMs:null};
     Object.defineProperty(window,'__cvBrowserVitals',{value:vitals,configurable:false});
     try{
       const observer=new PerformanceObserver(list=>{
         for(const entry of list.getEntries()){
           if(Number.isFinite(entry.startTime)){vitals.lcpObserved=true;vitals.lcpMs=Math.max(vitals.lcpMs||0,entry.startTime);}
         }
       });
       observer.observe({type:'largest-contentful-paint',buffered:true});
     }catch{}
     try{
       const observer=new PerformanceObserver(list=>{
         for(const entry of list.getEntries()){
           if(!entry.hadRecentInput&&Number.isFinite(entry.value)){vitals.clsObserved=true;vitals.cls+=entry.value;}
         }
       });
       observer.observe({type:'layout-shift',buffered:true});
       vitals.clsObserved=true;
     }catch{}
     try{
       const durations=new Map();
       const observer=new PerformanceObserver(list=>{
         for(const entry of list.getEntries()){
           if(entry.interactionId>0&&Number.isFinite(entry.duration)){
             durations.set(entry.interactionId,Math.max(durations.get(entry.interactionId)||0,entry.duration));
           }
         }
         vitals.interactionCount=durations.size;
         vitals.interactionDurationMs=durations.size?Math.max(...durations.values()):null;
       });
       observer.observe({type:'event',buffered:true,durationThreshold:16});
     }catch{}
   });
   const consoleErrors=[],consoleWarnings=[],requestFailures=[],responseFailures=[];let expectedContactFailureResponse=false;
   page.on('console',m=>{if(m.type()==='error'&&!(expectedContactFailureResponse&&/status of 400/i.test(m.text())))consoleErrors.push(m.text());if(m.type()==='warning')consoleWarnings.push(m.text());});
   page.on('requestfailed',r=>requestFailures.push({url:r.url(),failure:r.failure()?.errorText||'request failed'}));
   page.on('response',r=>{if(r.status()>=500)responseFailures.push({url:r.url(),status:r.status()});});
   let status=0,error=null,ui={},screenshot=null,domSnapshot=null,visual=null,performance={},performanceAudit=null,accessibility={},interactions={};
   try{
    const response=await page.goto(new URL(p,baseUrl).toString(),{waitUntil:'networkidle',timeout:15000});
    status=response?.status()||0;
    if(p==='/'){const primaryCta=page.locator('[data-primary-cta]').first();if(await primaryCta.count()){const box=await primaryCta.boundingBox();interactions.ctaAboveFoldDetails=box?{y:box.y,height:box.height,viewportHeight:viewport.height}:null;interactions.ctaAboveFoldVerified=Boolean(box&&box.y>=0&&box.y+box.height<=viewport.height)}}
    const links=await page.locator('a[href]').evaluateAll(els=>els.map(e=>e.getAttribute('href')).filter(Boolean).filter(x=>x.startsWith('/')));
    for(const link of links){const linkedResponse=await fetch(new URL(link,baseUrl));const optionalIntegration=/^\/auth\/google(?:\?|$)/.test(link)&&linkedResponse.status===503;if(!(linkedResponse.status>=200&&linkedResponse.status<400)&&!optionalIntegration)requestFailures.push({url:linkedResponse.url,failure:`internal link ${linkedResponse.status}`});}
    ui=await page.evaluate(()=>{const images=[...document.images],buttons=[...document.querySelectorAll('button,input[type="button"],input[type="submit"],input[type="reset"],input[type="image"]')],links=[...document.querySelectorAll('a[href]')],formControls=[...document.querySelectorAll('input:not([type="hidden"]),select,textarea')],headings=[...document.querySelectorAll('h1,h2,h3,h4,h5,h6')],rect=document.documentElement.getBoundingClientRect(),text=document.body?.innerText||'';
      const nameOf=element=>{const aria=element.getAttribute('aria-label')?.trim();if(aria)return aria;const labelled=(element.getAttribute('aria-labelledby')||'').split(/\s+/).filter(Boolean).map(id=>document.getElementById(id)?.innerText||document.getElementById(id)?.textContent||'').join(' ').trim();if(labelled)return labelled;const labels=element.labels?[...element.labels].map(label=>label.innerText||label.textContent||'').join(' ').trim():element.closest('label')?.innerText?.trim()||'';if(labels)return labels;const type=String(element.getAttribute('type')||'').toLowerCase();if(['button','submit','reset'].includes(type)&&element.value?.trim())return element.value.trim();const imageAlt=element.querySelector('img[alt]')?.getAttribute('alt')?.trim();if(imageAlt)return imageAlt;return (element.innerText||element.getAttribute('title')||'').trim();};
      return{title:document.title||'',lang:document.documentElement.lang||'',viewport:!!document.querySelector('meta[name="viewport"]'),main:!!document.querySelector('main'),nav:!!document.querySelector('nav'),h1:document.querySelectorAll('h1').length,headingLevels:headings.map(element=>Number(element.tagName.slice(1))),imagesMissingAlt:images.filter(image=>!image.hasAttribute('alt')).length,controlsWithoutName:buttons.filter(element=>!nameOf(element)).length,linksWithoutName:links.filter(element=>!nameOf(element)).length,formControlsWithoutName:formControls.filter(element=>!nameOf(element)).length,interactiveAriaHidden:[...document.querySelectorAll('a[href],button,input:not([type="hidden"]),select,textarea,[role="button"],[role="link"],[role="checkbox"],[role="radio"],[tabindex]:not([tabindex="-1"])')].filter(element=>element.getAttribute('aria-hidden')==='true').length,smallTouchTargets:[...document.querySelectorAll('button,.nav-link,.primary-link,.primary-cta,.cookie-settings-trigger,.file-button')].filter(element=>element.getClientRects().length).filter(element=>{const box=element.getBoundingClientRect();return box.width<24||box.height<44}).slice(0,8).map(element=>({tag:element.tagName.toLowerCase(),className:String(element.className||'').slice(0,80),width:Math.round(element.getBoundingClientRect().width),height:Math.round(element.getBoundingClientRect().height)})),documentWidth:rect.width,bodyScrollWidth:document.body?.scrollWidth||rect.width,bodyTextLength:text.length,textContrastSamples:(()=>{ 
        const parseColor=value=>{const matches=String(value||'').match(/[+-]?(?:\d*\.)?\d+%?/g);if(!matches||matches.length<3)return null;const channel=part=>part.endsWith('%')?Math.max(0,Math.min(255,parseFloat(part)*2.55)):Math.max(0,Math.min(255,parseFloat(part)));const alpha=matches.length>3?Math.max(0,Math.min(1,parseFloat(matches[3]))):1;return{r:channel(matches[0]),g:channel(matches[1]),b:channel(matches[2]),a:alpha};};
        const blend=(front,back)=>{const alpha=front.a+back.a*(1-front.a);if(alpha<=0)return{r:255,g:255,b:255,a:1};return{r:(front.r*front.a+back.r*back.a*(1-front.a))/alpha,g:(front.g*front.a+back.g*back.a*(1-front.a))/alpha,b:(front.b*front.a+back.b*back.a*(1-front.a))/alpha,a:alpha};};
        const luminance=color=>{const convert=value=>{const x=value/255;return x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4;};return 0.2126*convert(color.r)+0.7152*convert(color.g)+0.0722*convert(color.b);};
        const nodes=[...document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,label,a[href],button,summary,figcaption,blockquote,td,th,legend')].filter(element=>element.getClientRects().length&&getComputedStyle(element).visibility!=='hidden'&&getComputedStyle(element).display!=='none'&&element.innerText?.trim());
        const seen=new Set(),samples=[];
        for(const element of nodes){
          const ownText=[...element.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE).map(node=>node.textContent||'').join(' ').replace(/\s+/g,' ').trim();
          const text=ownText||(['A','BUTTON','LABEL','SUMMARY','LEGEND','TD','TH','FIGCAPTION'].includes(element.tagName)?(element.innerText||'').trim():'');
          if(!text)continue;
          const identity=element.tagName+'|'+text;if(seen.has(identity))continue;seen.add(identity);
          const style=getComputedStyle(element),fontSize=parseFloat(style.fontSize)||16,fontWeight=parseInt(style.fontWeight,10)||400;
          const minimum=(fontSize>=24||(fontSize>=18.66&&fontWeight>=700))?3:4.5;
          if(style.backgroundImage&&style.backgroundImage!=='none'||Number(style.opacity)<0.99){samples.push({text,minimum,skippedReason:'image_background_or_group_opacity'});continue;}
          let backdrop={r:255,g:255,b:255,a:1},chain=[];for(let current=element;current;current=current.parentElement)chain.unshift(current);
          let unsupported=false;
          for(const current of chain){const currentStyle=getComputedStyle(current);if(currentStyle.backgroundImage&&currentStyle.backgroundImage!=='none'){unsupported=true;break;}if(Number(currentStyle.opacity)<0.99){unsupported=true;break;}const color=parseColor(currentStyle.backgroundColor);if(color)backdrop=blend(color,backdrop);}
          const foreground=parseColor(style.color);
          if(unsupported||!foreground){samples.push({text,minimum,skippedReason:'complex_background_or_color'});continue;}
          const actualForeground=blend(foreground,backdrop),a=luminance(actualForeground),b=luminance(backdrop),ratio=(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
          samples.push({text,minimum,ratio});
          if(samples.length>=100)break;
        }
        return samples;
      })(),forms:document.querySelectorAll('form').length};});
    const accessibilityAudit=assessAccessibilitySemantics(ui);
    const contrastAudit=assessTextContrast(ui.textContrastSamples||[]);
    const uiFailures=[];if(!ui.title)uiFailures.push('missing document title');if(!ui.lang)uiFailures.push('missing html lang');if(ui.viewport===false)uiFailures.push('missing responsive viewport');if(ui.main===false)uiFailures.push('missing main landmark');uiFailures.push(...accessibilityAudit.failures);uiFailures.push(...contrastAudit.failures);if(ui.bodyScrollWidth>ui.documentWidth+4)uiFailures.push('horizontal overflow detected');
    const focusableCount=await page.locator('a[href],button,input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]').count();
    let firstTabFocused=false,focusIndicatorVisible=null,focusIndicator=null;
    if(focusableCount>0){
      await page.keyboard.press('Tab');
      firstTabFocused=await page.evaluate(()=>{const el=document.activeElement;return !!el&&el!==document.body&&!!el.matches('a[href],button,input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])');});
      if(firstTabFocused){focusIndicator=await page.evaluate(()=>{const el=document.activeElement,style=getComputedStyle(el),width=Number.parseFloat(style.outlineWidth)||0,hasOutline=style.outlineStyle!=='none'&&width>=2;return{tag:el.tagName.toLowerCase(),outlineStyle:style.outlineStyle,outlineWidth:style.outlineWidth,outlineColor:style.outlineColor,focusVisible:el.matches(':focus-visible'),visible:el.matches(':focus-visible')&&hasOutline};});focusIndicatorVisible=focusIndicator.visible;}
    }
    accessibility={keyboard:{focusableCount,firstTabFocused,focusIndicatorVisible,focusIndicator},landmarks:{main:Boolean(ui.main),nav:Boolean(ui.nav)},semantics:accessibilityAudit,contrast:contrastAudit};
    const measured=await page.evaluate(()=>{
      const nav=performance.getEntriesByType('navigation')[0];
      const resources=performance.getEntriesByType('resource');
      const paintEntries=performance.getEntriesByType('paint').map(entry=>({name:entry.name,startTime:entry.startTime}));
      return {
        navigation:nav?{
          duration:nav.duration,domContentLoadedEventEnd:nav.domContentLoadedEventEnd,
          requestStart:nav.requestStart,responseStart:nav.responseStart
        }:{},
        resources:resources.map(entry=>({
          name:entry.name,initiatorType:entry.initiatorType,
          transferSize:entry.transferSize,encodedBodySize:entry.encodedBodySize,
          renderBlockingStatus:entry.renderBlockingStatus??null
        })),
        paintEntries,
        vitals:window.__cvBrowserVitals||{}
      };
    });
    performance=normalizeBrowserPerformanceMetrics(measured);
    const auditResult=Object.keys(performance.metricsForAudit).length
      ? await runTool('web.performance.audit',{metrics:performance.metricsForAudit})
      : await runTool('web.performance.audit',{});
    performanceAudit={
      source:'playwright-browser-smoke',
      status:performance.measurementStatus,
      missingMetrics:performance.missingForAudit,
      notes:performance.measurementNotes,
      result:auditResult
    };
    if(screenshots){
      const safe=encodeURIComponent(p.slice(1)||'home').replace(/%/g,'_');screenshot=`${artifactDir}/${safe}.png`;domSnapshot=`${artifactDir}/${safe}.html`;
      await page.screenshot({path:screenshot,fullPage:true});fs.writeFileSync(domSnapshot,await page.content(),'utf8');
      if(baselineDir){const base=baselinePath(baselineDir,p),diff=`${artifactDir}/${visualArtifactName(p,'diff')}`;visual=await comparePng(screenshot,base,diff,{visualThreshold,pixelThreshold});}
    }
    if(p==='/'){
      const consent=page.locator('[data-cookie-consent]');
      if(await consent.count()){
        const initiallyVisible=await consent.isVisible();
        if(initiallyVisible)await page.locator('[data-cookie-reject]').click();
        await consent.waitFor({state:'hidden',timeout:3000});
        const rejected=await page.evaluate(()=>JSON.parse(localStorage.getItem('build-vibe-cookie-preferences-v1')||'null'));
        await page.locator('[data-cookie-reopen]').click();
        await consent.waitFor({state:'visible',timeout:3000});
        await page.locator('[data-cookie-settings]').click();
        await page.locator('[data-cookie-preferences]').waitFor({state:'visible',timeout:3000});
        const analyticsConfigured=analytics?.provider==='google-analytics'&&/^G-[A-Z0-9]{6,20}$/i.test(String(analytics.measurementId||''));
        let analyticsScriptRequests=0;
        if(analyticsConfigured)await page.route('https://www.googletagmanager.com/gtag/js**',async route=>{analyticsScriptRequests++;await route.fulfill({status:200,contentType:'application/javascript',body:'window.__buildVibeAnalyticsLoaded=true;'});});
        const requestsBeforeConsent=analyticsScriptRequests;
        await page.locator('[data-cookie-preferences] input[name="analytics"]').check();
        await page.locator('[data-cookie-preferences] button[type="submit"]').click();
        await consent.waitFor({state:'hidden',timeout:3000});
        const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('build-vibe-cookie-preferences-v1')||'null'));
        interactions.cookieConsentVerified=Boolean(initiallyVisible&&rejected?.analytics===false&&rejected?.marketing===false&&saved?.analytics===true&&saved?.marketing===false);
        if(analyticsConfigured){
          await page.waitForFunction(()=>window.__buildVibeAnalyticsLoaded===true,null,{timeout:3000});
          const loadedAfterConsent=analyticsScriptRequests===1;
          await page.locator('[data-cookie-reopen]').click();
          await consent.waitFor({state:'visible',timeout:3000});
          await page.locator('[data-cookie-settings]').click();
          await page.locator('[data-cookie-preferences]').waitFor({state:'visible',timeout:3000});
          await page.locator('[data-cookie-preferences] input[name="analytics"]').uncheck();
          await page.locator('[data-cookie-preferences] button[type="submit"]').click();
          await consent.waitFor({state:'hidden',timeout:3000});
          const revoked=await page.evaluate(()=>window.dataLayer?.some(entry=>entry[0]==='consent'&&entry[1]==='update'&&entry[2]?.analytics_storage==='denied'));
          interactions.analyticsConsentGateVerified=Boolean(requestsBeforeConsent===0&&loadedAfterConsent&&revoked);
        }
      }
      await page.setViewportSize({width:390,height:844});
      const sticky=page.locator('[data-sticky-cta]');
      if(await sticky.count()){
        const visible=await sticky.isVisible();
        if(visible)await sticky.locator('[data-dismiss-sticky-cta]').click();
        const dismissed=await page.evaluate(()=>sessionStorage.getItem('build-vibe-sticky-cta-dismissed')==='1');
        interactions.stickyMobileCtaVerified=Boolean(visible&&dismissed&&await sticky.isHidden());
      }
    }
    if(p==='/contact'){
      const form=page.locator('#contactForm');
      if(await form.count()){
        const consent=page.locator('[data-cookie-consent]');
        if(await consent.isVisible().catch(()=>false))await page.locator('[data-cookie-reject]').click();
        await form.locator('[name="name"]').fill('Build Vibe QA');
        await form.locator('[name="email"]').fill('qa@example.test');
        await form.locator('[name="message"]').fill('Automated verification test message');
        await page.route('**/api/contact',async route=>{await new Promise(resolve=>setTimeout(resolve,120));await route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({error:'Simulated verification failure'})});});
        expectedContactFailureResponse=true;
        const submit=form.locator('[data-submit-button]');
        await submit.click();
        const disabledDuring=await submit.isDisabled();
        const busyDuring=await form.getAttribute('aria-busy');
        await page.locator('#contactError').waitFor({state:'visible',timeout:5000});
        const errorVisible=await page.locator('#contactError').isVisible();
        await page.waitForFunction(()=>{const button=document.querySelector('[data-submit-button]');return Boolean(button&&!button.disabled);},null,{timeout:5000});
        interactions.formErrorsVerified=Boolean(errorVisible&&await page.locator('#contactError').textContent());
        interactions.loadingStatesVerified=Boolean(disabledDuring&&busyDuring==='true');
        expectedContactFailureResponse=false;
        await page.unroute('**/api/contact');
        await page.route('**/api/contact',route=>route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({ok:true})}));
        await submit.click();
        await page.waitForURL(url=>new URL(url).pathname==='/thank-you',{timeout:5000});
        const robots=await page.locator('meta[name="robots"]').getAttribute('content');
        interactions.thankYouRuntimeVerified=new URL(page.url()).pathname==='/thank-you'&&robots==='noindex,nofollow';
      }
    }
    const responsive=[];
    for(const targetViewport of responsiveViewports){
      await page.setViewportSize({width:targetViewport.width,height:targetViewport.height});
      await page.waitForTimeout(40);
      const measurements=await page.evaluate(()=>{
        const viewportWidth=window.innerWidth;
        const documentWidth=document.documentElement?.scrollWidth||0;
        const bodyWidth=document.body?.scrollWidth||0;
        const overflowingElements=Array.from(document.querySelectorAll('html,body,body *')).filter(element=>{
          const rect=element.getBoundingClientRect();
          return rect.width>0&&(rect.right>viewportWidth+2||element.scrollWidth>element.clientWidth+2);
        }).slice(0,8).map(element=>{
          const tag=element.tagName.toLowerCase();
          const id=element.id?'#'+element.id:'';
          const classes=typeof element.className==='string'?'.'+element.className.trim().split(/\s+/).filter(Boolean).slice(0,2).join('.'): '';
          const rect=element.getBoundingClientRect();
          return (tag+id+classes+'[right='+Math.round(rect.right)+',scroll='+element.scrollWidth+',client='+element.clientWidth+']').slice(0,160);
        });
        return {viewportWidth,documentWidth,bodyWidth,overflowingElements};
      });
      const audit=assessResponsiveLayout(measurements);
      responsive.push({...audit,height:targetViewport.height});
      for(const failure of audit.failures)uiFailures.push(failure);
    }
    await page.setViewportSize(viewport);
    const quality=assessBrowserQuality({status,error,consoleErrors,requestFailures,responseFailures,uiFailures,visual,performance,accessibility},{maxLoadMs,maxTransferBytes});
    results.push({path:p,status,consoleErrors,consoleWarnings,requestFailures,responseFailures,error,ui,uiFailures,screenshot,domSnapshot,visual,performance,performanceAudit,accessibility,responsive,interactions,quality,ok:quality.ok});
   }catch(e){error=e.message;const quality=assessBrowserQuality({status,error,consoleErrors,requestFailures,responseFailures,uiFailures:[]},{maxLoadMs,maxTransferBytes});results.push({path:p,status,consoleErrors,consoleWarnings,requestFailures,responseFailures,error,ui,uiFailures:[],screenshot,domSnapshot,visual,performance,performanceAudit,accessibility,quality,ok:false});}
   await page.close();
  }
 }finally{await browser.close();}
 return{enabled:true,available:true,passed:results.every(x=>x.ok),results,uiQuality:{pages:results.length,passed:results.filter(x=>x.uiFailures.length===0).length,failures:results.flatMap(x=>x.uiFailures.map(f=>`${x.path}: ${f}`))},debug:{consoleErrors:results.reduce((n,x)=>n+x.consoleErrors.length,0),requestFailures:results.reduce((n,x)=>n+x.requestFailures.length,0),serverErrors:results.reduce((n,x)=>n+x.responseFailures.length,0),visualFailures:results.filter(x=>x.visual?.passed===false).length,performanceFailures:results.filter(x=>x.quality?.failures.some(f=>/navigation took|transfer was/.test(f))).length,accessibilityFailures:results.filter(x=>x.quality?.failures.some(f=>/keyboard|accessible|landmark|aria/.test(f))).length}};
}
