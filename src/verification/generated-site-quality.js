import path from 'node:path';

export const GENERATED_SITE_REQUIREMENTS = Object.freeze([
  {id:'custom-404',label:'Custom 404 page and HTTP 404 response',severity:'critical'},
  {id:'meta-title',label:'Unique title for every public page',severity:'critical'},
  {id:'meta-description',label:'Useful description for every public page',severity:'high'},
  {id:'primary-cta',label:'Primary call to action above the fold',severity:'high'},
  {id:'favicon-set',label:'Favicon and app icon set',severity:'medium'},
  {id:'robots-txt',label:'robots.txt crawl policy',severity:'high'},
  {id:'sitemap-xml',label:'Valid sitemap.xml with public URLs',severity:'high'},
  {id:'open-graph-image',label:'Valid Open Graph preview image',severity:'medium'},
  {id:'image-alt',label:'Alternative text for meaningful images',severity:'high'},
  {id:'mobile-breakpoints',label:'Responsive mobile breakpoints',severity:'high'},
  {id:'sticky-mobile-cta',label:'Optional sticky mobile call to action',severity:'medium'},
  {id:'loading-states',label:'Loading states for asynchronous actions',severity:'high'},
  {id:'form-error-states',label:'Accessible form errors and recovery',severity:'critical'},
  {id:'thank-you-page',label:'Truthful form submission confirmation',severity:'high'},
  {id:'privacy-policy',label:'Privacy policy page',severity:'critical'},
  {id:'terms-page',label:'Terms and conditions page',severity:'high'},
  {id:'cookie-consent',label:'Cookie consent and preferences where required',severity:'critical'},
  {id:'analytics',label:'Configured, consent-aware customer-site analytics',severity:'medium'},
  {id:'contact-address',label:'Owner-provided real contact address',severity:'high'},
  {id:'compressed-images',label:'Optimized generated image assets',severity:'medium'},
]);

const STATUSES = new Set(['PASS','FAIL','NEEDS_INPUT','NOT_APPLICABLE']);
const text = value => typeof value === 'string' ? value : '';
const entries = value => value instanceof Map ? [...value.entries()] : Object.entries(value || {});
const contentOf = value => typeof value === 'string' ? value : text(value?.content);
const normalize = value => String(value || '').replaceAll('\\','/').replace(/^\.\//,'');
const isHtml = name => /\.html?$/i.test(name);
const isPrivateHtml = name => /(^|\/)(admin|login|signup|app|ops|pay|checkout)(?:\.html)?$/i.test(name);
const routeOf = name => {
  const rel=normalize(name).replace(/^public\//,'');
  if(rel==='index.html')return '/';
  return '/'+rel.replace(/\.html?$/i,'').replace(/\/index$/,'');
};
const tagContent = (html, pattern) => [...html.matchAll(pattern)].map(match=>match[1] || '');

function resolveAsset(files, url, baseUrl) {
  const raw=String(url||'').trim();
  if(!raw || /^data:/i.test(raw)) return null;
  if(/^https?:\/\//i.test(raw)) {
    if(!baseUrl || !raw.startsWith(baseUrl.replace(/\/$/,''))) return null;
    try { return files.get('public/'+new URL(raw).pathname.replace(/^\//,''))||files.get(new URL(raw).pathname.replace(/^\//,''))||null; } catch { return null; }
  }
  const pathname=raw.split(/[?#]/)[0].replace(/^\//,'');
  return files.get('public/'+pathname)||files.get(pathname)||null;
}

/** Audits generated artifacts plus explicit runtime evidence; missing evidence never silently passes. */
export function auditGeneratedSite({files={},baseUrl='',config={}}={}) {
  const fileEntries=entries(files).map(([name,value])=>[normalize(name),value]);
  const fileMap=new Map(fileEntries);
  const read=name=>contentOf(fileMap.get(name)||'');
  const htmlPages=fileEntries.filter(([name,value])=>isHtml(name)&&!isPrivateHtml(name)&&contentOf(value));
  const pageData=htmlPages.map(([name,value])=>{
    const html=contentOf(value);
    const title=tagContent(html,/<title\b[^>]*>([\s\S]*?)<\/title>/i)[0]?.replace(/<[^>]+>/g,'').trim()||'';
    const description=tagContent(html,/<meta\b[^>]*\bname=["']description["'][^>]*\bcontent=["']([^"']*)["'][^>]*>/i)[0]?.trim()||'';
    return {name,html,title,description,route:routeOf(name)};
  });
  const publicHtml=pageData.filter(page=>page.route!=='/404'&&!/not-found/i.test(page.name));
  const titles=publicHtml.map(page=>page.title.toLowerCase()).filter(Boolean);
  const allTitlesPresent=publicHtml.length>0&&publicHtml.every(page=>page.title.length>0);
  const uniqueTitles=new Set(titles).size===titles.length;
  const allDescriptions=publicHtml.length>0&&publicHtml.every(page=>page.description.length>=50&&page.description.length<=170);
  const allHtml=pageData.map(page=>page.html).join('\n');
  const allFilesText=fileEntries.map(([name,value])=>name+'\n'+contentOf(value)).join('\n');
  const robots=read('public/robots.txt')||read('robots.txt');
  const sitemap=read('public/sitemap.xml')||read('sitemap.xml');
  const iconFiles=fileEntries.filter(([name])=>/favicon\.(svg|ico|png)$/i.test(name)||/apple-touch-icon.*\.(png|webp)$/i.test(name)||/icon-\d+.*\.(png|webp)$/i.test(name));
  const manifest=read('public/site.webmanifest')||read('public/manifest.webmanifest')||read('public/manifest.json')||read('site.webmanifest');
  const ctaEvidence=publicHtml.filter(page=>/<a\b[^>]*class=["'][^"']*(?:primary-cta|cta-primary|primary)[^"']*["'][^>]*>/i.test(page.html)||/<a\b[^>]*data-primary-cta(?:=["'][^"']*["'])?[^>]*>/i.test(page.html));
  const images=[...allHtml.matchAll(/<img\b[^>]*>/gi)].map(match=>match[0]);
  const missingAlt=images.filter(tag=>!/\balt\s*=\s*["'][^"']*["']/i.test(tag));
  const cssText=fileEntries.filter(([name])=>/\.css$/i.test(name)).map(([,value])=>contentOf(value)).join('\n');
  const formPresent=/<form\b/i.test(allHtml);
  const alertOrError=/(role=["']alert["']|aria-invalid|aria-describedby|field-error|form-error)/i.test(allHtml+'\n'+allFilesText);
  const loadingPresent=/(aria-busy|loading(?:state|State|\.\.\.)|data-loading|role=["']status["'])/i.test(allHtml+'\n'+allFilesText);
  const contactAddress=text(config.contactAddress).trim();
  const imageAssets=fileEntries.filter(([name,value])=>/\.(png|jpe?g|webp|avif)$/i.test(name)&&value&&typeof value==='object');
  const socialUrl=tagContent(allHtml,/<meta\b[^>]*\bproperty=["']og:image["'][^>]*\bcontent=["']([^"']+)["'][^>]*>/i)[0]||'';
  const socialAsset=resolveAsset(fileMap,socialUrl,baseUrl);
  const socialMetaOk=!!socialUrl&&(/^(https?:\/\/|\/)/i.test(socialUrl));
  const socialDimensions=socialAsset&&typeof socialAsset==='object'&&socialAsset.width>=1200&&socialAsset.height>=600;
  const hasPrivacy=pageData.some(page=>/^\/(privacy|privacy-policy)$/.test(page.route));
  const hasTerms=pageData.some(page=>/^\/(terms|terms-and-conditions)$/.test(page.route));
  const has404=pageData.some(page=>page.route==='/404'||/404|not-found/i.test(page.name));
  const siteGoal=text(config.siteGoal).toLowerCase();
  const noCtaNeeded=['documentation','docs','knowledge-base'].includes(siteGoal);
  const analyticsDisabled=config.analyticsEnabled===false;
  const checks=[
    result('custom-404',!has404?'FAIL':config.http404Verified===true?'PASS':'NEEDS_INPUT',[has404?'404 artifact exists':'No 404 artifact found',config.http404Verified===true?'Runtime HTTP 404 verified':'Runtime 404 status not verified'],'Generate a branded 404 page and verify unknown routes return HTTP 404, not HTTP 200.'),
    result('meta-title',allTitlesPresent&&uniqueTitles?'PASS':'FAIL',['Public HTML routes: '+publicHtml.length,'Titles present: '+publicHtml.filter(page=>page.title).length,'Unique title count: '+new Set(titles).size],'Give every public route a useful, distinct title.'),
    result('meta-description',allDescriptions?'PASS':'FAIL',['Routes with descriptions of 50–170 characters: '+publicHtml.filter(page=>page.description.length>=50&&page.description.length<=170).length+'/'+publicHtml.length],'Add a useful route-specific description of approximately 50–160 characters.'),
    result('primary-cta',config.ctaAboveFoldVerified===true?'PASS':noCtaNeeded?'NOT_APPLICABLE':ctaEvidence.length?'NEEDS_INPUT':'FAIL',['Pages with recognizable primary CTA: '+ctaEvidence.length,config.ctaAboveFoldVerified===true?'Viewport placement verified':'Above-the-fold placement not verified'],'Verify the primary action is visible without scrolling at target desktop and mobile viewport sizes.'),
    result('favicon-set',iconFiles.length&&manifest?'PASS':'FAIL',['Icon assets found: '+iconFiles.length,manifest?'Web app manifest exists':'No web app manifest found'],'Provide favicon plus manifest with suitable app icons for supported platforms.'),
    result('robots-txt',/^User-agent:/im.test(robots)&&/Sitemap:\s*https?:\/\//i.test(robots)?'PASS':'FAIL',[robots?'robots.txt exists':'robots.txt missing',/Sitemap:\s*https?:\/\//i.test(robots)?'Absolute sitemap URL found':'Absolute sitemap URL missing'],'Add a valid robots.txt and absolute sitemap URL for the production host.'),
    result('sitemap-xml',/<urlset\b/i.test(sitemap)&&/<loc>https?:\/\//i.test(sitemap)?'PASS':'FAIL',[sitemap?'sitemap.xml exists':'sitemap.xml missing','Public route count: '+publicHtml.length],'Generate valid XML containing absolute URLs for all public, indexable routes and excluding private routes.'),
    result('open-graph-image',socialMetaOk&&(socialDimensions||config.openGraphImageVerified===true)?'PASS':socialMetaOk?'NEEDS_INPUT':'FAIL',[socialUrl?'Open Graph image URL found':'Open Graph image URL missing',socialDimensions?'Image dimensions meet 1200×600 minimum':config.openGraphImageVerified===true?'Image response verified':'Image response/dimensions not verified'],'Provide a reachable, branded social preview image and verify its response and dimensions.'),
    result('image-alt',images.length===0?'NOT_APPLICABLE':missingAlt.length===0?'PASS':'FAIL',['Images: '+images.length,'Images missing explicit alt attribute: '+missingAlt.length],'Add useful alt text to meaningful images; use alt="" only for decorative images.'),
    result('mobile-breakpoints',/@media\s*\([^)]*(?:max|min)-width\s*:/i.test(cssText)?'PASS':'FAIL',[cssText?'CSS files found':'No CSS files found'],'Add and browser-test responsive breakpoints and verify there is no horizontal overflow.'),
    result('sticky-mobile-cta',noCtaNeeded?'NOT_APPLICABLE':config.stickyMobileCtaImplemented===true?'PASS':'NEEDS_INPUT',[config.stickyMobileCtaImplemented===true?'Sticky CTA explicitly confirmed':'No verified sticky mobile CTA'],'If appropriate for the site goal, add a keyboard-accessible, dismissible sticky CTA that does not obscure content.'),
    result('loading-states',!formPresent?'NOT_APPLICABLE':config.loadingStatesVerified===true?'PASS':loadingPresent?'NEEDS_INPUT':'FAIL',[formPresent?'Form found':'No form found',loadingPresent?'Loading/status semantics found':'Loading state not found'],'Test real asynchronous flows, progress/status messaging, disabled submit, and duplicate-submit prevention.'),
    result('form-error-states',!formPresent?'NOT_APPLICABLE':config.formErrorsVerified===true?'PASS':alertOrError?'NEEDS_INPUT':'FAIL',[formPresent?'Form found':'No form found',alertOrError?'Error-related markup found':'Accessible error evidence missing'],'Test field validation, accessible error announcements, server failures, and retry behavior.'),
    result('thank-you-page',config.thankYouRoute&&pageData.some(page=>page.route===config.thankYouRoute)?'PASS':config.thankYouRoute?'NEEDS_INPUT':formPresent?'FAIL':'NOT_APPLICABLE',[config.thankYouRoute?'Configured confirmation route: '+config.thankYouRoute:'No confirmation route configured'],'Show confirmation only after a successful submission; provide a real confirmation route or state.'),
    result('privacy-policy',hasPrivacy?'PASS':'FAIL',[hasPrivacy?'Privacy page found':'Privacy page missing'],'Generate a privacy page based on the actual data processing and integrations; request owner review.'),
    result('terms-page',hasTerms?'PASS':'FAIL',[hasTerms?'Terms page found':'Terms page missing'],'Provide terms appropriate to the actual product, payments, and jurisdiction.'),
    result('cookie-consent',config.cookieConsentImplemented===true?'PASS':config.cookiesOrTrackingRequired===false?'NOT_APPLICABLE':'NEEDS_INPUT',[config.cookieConsentImplemented===true?'Consent manager explicitly confirmed':'Consent behavior not verified'],'Where required, gate non-essential tracking behind consent and support preferences and withdrawal.'),
    result('analytics',analyticsDisabled?'NOT_APPLICABLE':config.analyticsConfigured===true&&config.analyticsConsentAware===true?'PASS':'NEEDS_INPUT',[analyticsDisabled?'Customer analytics disabled by owner':config.analyticsConfigured===true?'Analytics configured; consent integration needs confirmation':'Customer-site analytics configuration not supplied'],'Ask the owner to configure analytics; verify events and consent behavior. Never infer customer analytics from platform analytics.'),
    result('contact-address',contactAddress?'PASS':'NEEDS_INPUT',[contactAddress?'Owner-supplied contact address present':'Real contact address required from site owner'],'Request a real business address from the owner. Never invent an address.'),
    result('compressed-images',imageAssets.length===0?'NEEDS_INPUT':imageAssets.every(([,asset])=>asset.sizeBytes>0&&asset.sizeBytes<=300000&&(/image\/(?:avif|webp)/i.test(asset.contentType||'')||/\.(?:avif|webp)$/i.test(asset.name||'')))?'PASS':'NEEDS_INPUT',['Image assets with measurable metadata: '+imageAssets.length,'Optimization requires byte-size and format evidence'],'Integrate image optimization into generation/export and verify formats, dimensions, byte budgets, and visual quality.'),
  ];
  const normalized=checks.map(check=>({...check,status:STATUSES.has(check.status)?check.status:'FAIL',severity:GENERATED_SITE_REQUIREMENTS.find(item=>item.id===check.id)?.severity||'medium'}));
  const summary={total:normalized.length,pass:normalized.filter(x=>x.status==='PASS').length,fail:normalized.filter(x=>x.status==='FAIL').length,needsInput:normalized.filter(x=>x.status==='NEEDS_INPUT').length,notApplicable:normalized.filter(x=>x.status==='NOT_APPLICABLE').length};
  return {version:'generated-site-quality.v1',generatedAt:new Date().toISOString(),baseUrl:baseUrl||null,summary,publishable:!normalized.some(item=>item.severity==='critical'&&item.status!=='PASS'&&item.status!=='NOT_APPLICABLE'),requirements:normalized};
}

function result(id,status,evidence=[],remediation='') {
  return {id,status,evidence:[...evidence].filter(Boolean),remediation};
}
