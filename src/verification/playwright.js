import {baselinePath,comparePng,visualArtifactName} from './visual.js';

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
  return{ok:failures.length===0,failures};
}

export async function browserSmoke(baseUrl,paths,{screenshots=false,artifactDir='artifacts',baselineDir='',viewport={width:1440,height:900},visualThreshold,pixelThreshold,maxLoadMs=Number(process.env.CODINGVIBES_BROWSER_MAX_LOAD_MS||5000),maxTransferBytes=Number(process.env.CODINGVIBES_BROWSER_MAX_TRANSFER_BYTES||8_000_000)}={}){
 let pw;try{pw=await import('playwright');}catch{return{enabled:true,available:false,passed:false,skipped:'playwright not installed',results:[]};}
 const fs=await import('node:fs');fs.mkdirSync(artifactDir,{recursive:true});const browser=await pw.chromium.launch({headless:true});const results=[];
 try{
  for(const p of paths){
   const page=await browser.newPage({viewport});
   const consoleErrors=[],consoleWarnings=[],requestFailures=[],responseFailures=[];
   page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());if(m.type()==='warning')consoleWarnings.push(m.text());});
   page.on('requestfailed',r=>requestFailures.push({url:r.url(),failure:r.failure()?.errorText||'request failed'}));
   page.on('response',r=>{if(r.status()>=500)responseFailures.push({url:r.url(),status:r.status()});});
   let status=0,error=null,ui={},screenshot=null,domSnapshot=null,visual=null,performance={},accessibility={};
   try{
    const response=await page.goto(new URL(p,baseUrl).toString(),{waitUntil:'networkidle',timeout:15000});
    status=response?.status()||0;
    const links=await page.locator('a[href]').evaluateAll(els=>els.map(e=>e.getAttribute('href')).filter(Boolean).filter(x=>x.startsWith('/')));
    for(const link of links){const linkedResponse=await fetch(new URL(link,baseUrl));if(!(linkedResponse.status>=200&&linkedResponse.status<400))requestFailures.push({url:linkedResponse.url(),failure:`internal link ${linkedResponse.status}`});}
    const metrics=await page.evaluate(()=>{const nav=performance.getEntriesByType('navigation')[0];const resources=performance.getEntriesByType('resource');return{navigationDurationMs:nav?.duration||0,domContentLoadedMs:nav?.domContentLoadedEventEnd||0,firstContentfulPaintMs:performance.getEntriesByName('first-contentful-paint')[0]?.startTime||null,transferBytes:resources.reduce((n,x)=>n+(Number(x.transferSize)||0),0)};});
    performance=metrics;
    ui=await page.evaluate(()=>{const images=[...document.images],buttons=[...document.querySelectorAll('button,input[type="button"],input[type="submit"]')],links=[...document.querySelectorAll('a[href]')],rect=document.documentElement.getBoundingClientRect(),text=document.body?.innerText||'';return{title:document.title||'',lang:document.documentElement.lang||'',viewport:!!document.querySelector('meta[name="viewport"]'),main:!!document.querySelector('main'),nav:!!document.querySelector('nav'),h1:document.querySelectorAll('h1').length,imagesWithoutAlt:images.filter(x=>!x.getAttribute('alt')).length,controlsWithoutName:buttons.filter(x=>!(x.getAttribute('aria-label')||x.textContent?.trim()||x.getAttribute('title'))).length,linksWithoutName:links.filter(x=>!(x.getAttribute('aria-label')||x.textContent?.trim()||x.getAttribute('title'))).length,interactiveAriaHidden:[...document.querySelectorAll('button,a[href],input,select,textarea')].filter(x=>x.getAttribute('aria-hidden')==='true').length,documentWidth:rect.width,bodyScrollWidth:document.body?.scrollWidth||rect.width,bodyTextLength:text.length,forms:document.querySelectorAll('form').length};});
    const uiFailures=[];if(!ui.title)uiFailures.push('missing document title');if(!ui.lang)uiFailures.push('missing html lang');if(ui.viewport===false)uiFailures.push('missing responsive viewport');if(ui.main===false)uiFailures.push('missing main landmark');if(ui.imagesWithoutAlt>0)uiFailures.push(`${ui.imagesWithoutAlt} image(s) without alt text`);if(ui.controlsWithoutName>0)uiFailures.push(`${ui.controlsWithoutName} control(s) without accessible name`);if(ui.linksWithoutName>0)uiFailures.push(`${ui.linksWithoutName} link(s) without accessible name`);if(ui.interactiveAriaHidden>0)uiFailures.push(`${ui.interactiveAriaHidden} interactive element(s) incorrectly aria-hidden`);if(ui.bodyScrollWidth>ui.documentWidth+4)uiFailures.push('horizontal overflow detected');
    const focusableCount=await page.locator('a[href],button,input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]').count();
    let firstTabFocused=false;
    if(focusableCount>0){await page.keyboard.press('Tab');firstTabFocused=await page.evaluate(()=>{const el=document.activeElement;return !!el&&el!==document.body&&!!el.matches('a[href],button,input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])');});}
    accessibility={keyboard:{focusableCount,firstTabFocused},landmarks:{main:Boolean(ui.main),nav:Boolean(ui.nav)}};
    if(screenshots){
      const safe=encodeURIComponent(p.slice(1)||'home').replace(/%/g,'_');screenshot=`${artifactDir}/${safe}.png`;domSnapshot=`${artifactDir}/${safe}.html`;
      await page.screenshot({path:screenshot,fullPage:true});fs.writeFileSync(domSnapshot,await page.content(),'utf8');
      if(baselineDir){const base=baselinePath(baselineDir,p),diff=`${artifactDir}/${visualArtifactName(p,'diff')}`;visual=await comparePng(screenshot,base,diff,{visualThreshold,pixelThreshold});}
    }
    const quality=assessBrowserQuality({status,error,consoleErrors,requestFailures,responseFailures,uiFailures,visual,performance,accessibility},{maxLoadMs,maxTransferBytes});
    results.push({path:p,status,consoleErrors,consoleWarnings,requestFailures,responseFailures,error,ui,uiFailures,screenshot,domSnapshot,visual,performance,accessibility,quality,ok:quality.ok});
   }catch(e){error=e.message;const quality=assessBrowserQuality({status,error,consoleErrors,requestFailures,responseFailures,uiFailures:[]},{maxLoadMs,maxTransferBytes});results.push({path:p,status,consoleErrors,consoleWarnings,requestFailures,responseFailures,error,ui,uiFailures:[],screenshot,domSnapshot,visual,performance,accessibility,quality,ok:false});}
   await page.close();
  }
 }finally{await browser.close();}
 return{enabled:true,available:true,passed:results.every(x=>x.ok),results,uiQuality:{pages:results.length,passed:results.filter(x=>x.uiFailures.length===0).length,failures:results.flatMap(x=>x.uiFailures.map(f=>`${x.path}: ${f}`))},debug:{consoleErrors:results.reduce((n,x)=>n+x.consoleErrors.length,0),requestFailures:results.reduce((n,x)=>n+x.requestFailures.length,0),serverErrors:results.reduce((n,x)=>n+x.responseFailures.length,0),visualFailures:results.filter(x=>x.visual?.passed===false).length,performanceFailures:results.filter(x=>x.quality?.failures.some(f=>/navigation took|transfer was/.test(f))).length,accessibilityFailures:results.filter(x=>x.quality?.failures.some(f=>/keyboard|accessible|landmark|aria/.test(f))).length}};
}
