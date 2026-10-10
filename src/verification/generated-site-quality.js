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
const tagContent = (html, pattern) => { const flags=pattern.flags.includes('g')?pattern.flags:pattern.flags+'g'; return [...html.matchAll(new RegExp(pattern.source,flags))].map(match=>match[1]||''); };

function resolveAsset(files, url, baseUrl) {
  const raw=String(url||'').trim();
  if(!raw || /^data:/i.test(raw)) return null;
  if(/^__SITE_URL__\//.test(raw)){const pathname=raw.replace(/^__SITE_URL__\//,'');return files.get('public/'+pathname)||files.get(pathname)||null;}
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
  const configuredBase=String(baseUrl||'').replace(/\/$/,'');
  const tokenized=value=>String(value||'').replaceAll('__SITE_URL__',configuredBase||'__SITE_URL__');
  const allHtml=tokenized(pageData.map(page=>page.html).join('\n'));
  const allFilesText=tokenized(fileEntries.map(([name,value])=>name+'\n'+contentOf(value)).join('\n'));
  const robots=tokenized(read('public/robots.txt')||read('robots.txt'));
  const sitemap=tokenized(read('public/sitemap.xml')||read('sitemap.xml'));
  const iconFiles=fileEntries.filter(([name])=>/favicon\.(svg|ico|png)$/i.test(name)||/apple-touch-icon.*\.(png|webp)$/i.test(name)||/icon-\d+.*\.(png|webp)$/i.test(name));
  const manifest=read('public/site.webmanifest')||read('public/manifest.webmanifest')||read('public/manifest.json')||read('site.webmanifest');
  let manifestData=null;try{manifestData=JSON.parse(manifest)}catch{}
  const manifestHasIcons=Array.isArray(manifestData?.icons)&&manifestData.icons.some(icon=>typeof icon?.src==='string'&&icon.src.trim());
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
  const socialUrlTemplate=/^__SITE_URL__\//.test(socialUrl);
  const socialMetaOk=!!socialUrl&&(/^(https?:\/\/|\/)/i.test(socialUrl)||socialUrlTemplate);
  const socialAssetText=contentOf(socialAsset);
  const socialDimensions=Boolean(socialAsset&&((typeof socialAsset==='object'&&socialAsset.width>=1200&&socialAsset.height>=600)||(/<svg\b/i.test(socialAssetText)&&/width=[\"']1200[\"']/i.test(socialAssetText)&&/height=[\"']630[\"']/i.test(socialAssetText))));
  const hasPrivacy=pageData.some(page=>/^\/(privacy|privacy-policy)$/.test(page.route));
  const hasTerms=pageData.some(page=>/^\/(terms|terms-and-conditions)$/.test(page.route));
  const hasThankYou=pageData.some(page=>page.route==='/thank-you');
  const has404=pageData.some(page=>page.route==='/404'||/404|not-found/i.test(page.name));
  const siteGoal=text(config.siteGoal).toLowerCase();
  const noCtaNeeded=['documentation','docs','knowledge-base'].includes(siteGoal);
  const analyticsDisabled=config.analyticsEnabled===false;
  const cookieMarkupPresent=/data-cookie-consent/.test(allHtml)&&/data-cookie-accept/.test(allHtml)&&/data-cookie-reject/.test(allHtml)&&/data-cookie-settings/.test(allHtml);
  const cookieRuntimePresent=/localStorage\.setItem/.test(allFilesText)&&/build-vibe-cookie-preferences-v1/.test(allFilesText)&&/buildvibe:consentchange/.test(allFilesText);
  const cookieConsentReady=config.cookieConsentImplemented===false?false:config.cookieConsentImplemented===true||(cookieMarkupPresent&&cookieRuntimePresent);
  const stickyMarkupPresent=/data-sticky-cta/.test(allHtml)&&/data-dismiss-sticky-cta/.test(allHtml);
  const stickyRuntimePresent=/build-vibe-sticky-cta-dismissed/.test(allFilesText);
  const stickyCssPresent=/\.sticky-mobile-cta/.test(cssText)&&/@media\s*\([^)]*max-width\s*:/i.test(cssText);
  const stickyCtaReady=config.stickyMobileCtaImplemented===false?false:config.stickyMobileCtaImplemented===true||(stickyMarkupPresent&&stickyRuntimePresent&&stickyCssPresent);
  const analyticsConfigured=config.analyticsEnabled===true||/"measurementId"\s*:\s*"G-[A-Z0-9]{6,20}"/i.test(allFilesText);
  const analyticsConsentAware=config.analyticsConsentAware===true||(/buildvibe:consentchange/.test(allFilesText)&&/analytics_storage/.test(allFilesText));
  const analyticsReady=analyticsConfigured&&analyticsConsentAware&&config.analyticsDeliveryVerified===true;
  const checks=[
    result('custom-404',!has404?'FAIL':config.http404Verified===true?'PASS':'NEEDS_INPUT',[has404?'404 artifact exists':'No 404 artifact found',config.http404Verified===true?'Runtime HTTP 404 verified':'Runtime 404 status not verified'],'Generate a branded 404 page and verify unknown routes return HTTP 404, not HTTP 200.'),
    result('meta-title',allTitlesPresent&&uniqueTitles?'PASS':'FAIL',['Public HTML routes: '+publicHtml.length,'Titles present: '+publicHtml.filter(page=>page.title).length,'Unique title count: '+new Set(titles).size],'Give every public route a useful, distinct title.'),
    result('meta-description',allDescriptions?'PASS':'FAIL',['Routes with descriptions of 50–170 characters: '+publicHtml.filter(page=>page.description.length>=50&&page.description.length<=170).length+'/'+publicHtml.length],'Add a useful route-specific description of approximately 50–160 characters.'),
    result('primary-cta',config.ctaAboveFoldVerified===true?'PASS':noCtaNeeded?'NOT_APPLICABLE':ctaEvidence.length?'NEEDS_INPUT':'FAIL',['Pages with recognizable primary CTA: '+ctaEvidence.length,config.ctaAboveFoldVerified===true?'Viewport placement verified':'Above-the-fold placement not verified'],'Verify the primary action is visible without scrolling at target desktop and mobile viewport sizes.'),
    result('favicon-set',iconFiles.length&&manifestHasIcons?'PASS':'FAIL',['Icon assets found: '+iconFiles.length,manifest?'Web app manifest exists':'No web app manifest found',manifestHasIcons?'Manifest contains icon references':'Manifest icon references missing or invalid'],'Provide favicon plus a valid manifest with suitable app icons for supported platforms.'),
    result('robots-txt',/^User-agent:/im.test(robots)&&/Sitemap:\s*https?:\/\//i.test(robots)?'PASS':/^User-agent:/im.test(robots)&&/Sitemap:\s*__SITE_URL__\//i.test(robots)?'NEEDS_INPUT':'FAIL',[robots?'robots.txt exists':'robots.txt missing',/Sitemap:\s*https?:\/\//i.test(robots)?'Absolute sitemap URL found':/Sitemap:\s*__SITE_URL__\//i.test(robots)?'Production host placeholder remains':'Absolute sitemap URL missing'],'Set the production base URL and validate robots.txt before publishing.'),
    result('sitemap-xml',/<urlset\b/i.test(sitemap)&&/<loc>https?:\/\//i.test(sitemap)?'PASS':/<urlset\b/i.test(sitemap)&&/<loc>__SITE_URL__\//i.test(sitemap)?'NEEDS_INPUT':'FAIL',[sitemap?'sitemap.xml exists':'sitemap.xml missing','Public route count: '+publicHtml.length],'Set the production base URL and generate absolute URLs for public, indexable routes only.'),
    result('open-graph-image',socialMetaOk&&!socialUrlTemplate&&(socialDimensions||config.openGraphImageVerified===true)?'PASS':socialMetaOk?'NEEDS_INPUT':'FAIL',[socialUrl?'Open Graph image URL found':'Open Graph image URL missing',socialDimensions?'Image dimensions meet 1200×600 minimum':config.openGraphImageVerified===true?'Image response verified':'Production image response/dimensions not verified'],'Set the production base URL and verify the branded social image response and dimensions.'),
    result('image-alt',images.length===0?'NOT_APPLICABLE':missingAlt.length===0?'PASS':'FAIL',['Images: '+images.length,'Images missing explicit alt attribute: '+missingAlt.length],'Add useful alt text to meaningful images; use alt="" only for decorative images.'),
    result('mobile-breakpoints',/@media\s*\([^)]*(?:max|min)-width\s*:/i.test(cssText)?'PASS':'FAIL',[cssText?'CSS files found':'No CSS files found'],'Add and browser-test responsive breakpoints and verify there is no horizontal overflow.'),
    result('sticky-mobile-cta',noCtaNeeded?'NOT_APPLICABLE':stickyCtaReady?'PASS':'NEEDS_INPUT',[stickyCtaReady?'Mobile CTA markup, dismissal behavior, and responsive styles found':'No verified sticky mobile CTA'],'If appropriate for the site goal, add a keyboard-accessible, dismissible sticky CTA that does not obscure content.'),
    result('loading-states',!formPresent?'NOT_APPLICABLE':config.loadingStatesVerified===true?'PASS':loadingPresent?'NEEDS_INPUT':'FAIL',[formPresent?'Form found':'No form found',loadingPresent?'Loading/status semantics found':'Loading state not found'],'Test real asynchronous flows, progress/status messaging, disabled submit, and duplicate-submit prevention.'),
    result('form-error-states',!formPresent?'NOT_APPLICABLE':config.formErrorsVerified===true?'PASS':alertOrError?'NEEDS_INPUT':'FAIL',[formPresent?'Form found':'No form found',alertOrError?'Error-related markup found':'Accessible error evidence missing'],'Test field validation, accessible error announcements, server failures, and retry behavior.'),
    result('thank-you-page',config.thankYouRuntimeVerified===true&&hasThankYou?'PASS':hasThankYou?'NEEDS_INPUT':formPresent?'FAIL':'NOT_APPLICABLE',[hasThankYou?'Thank-you route exists':'Thank-you route missing',config.thankYouRuntimeVerified===true?'Successful submission redirect verified':'Submission-to-confirmation behavior not verified'],'Show confirmation only after a successful submission; provide a real confirmation route or state.'),
    result('privacy-policy',hasPrivacy?'PASS':'FAIL',[hasPrivacy?'Privacy page found':'Privacy page missing'],'Generate a privacy page based on the actual data processing and integrations; request owner review.'),
    result('terms-page',hasTerms?'PASS':'FAIL',[hasTerms?'Terms page found':'Terms page missing'],'Provide terms appropriate to the actual product, payments, and jurisdiction.'),
    result('cookie-consent',cookieConsentReady?'PASS':config.cookiesOrTrackingRequired===false?'NOT_APPLICABLE':'NEEDS_INPUT',[cookieConsentReady?'Consent interface, preference storage, and change event found':'Consent behavior not verified'],'Where required, gate non-essential tracking behind consent and support preferences and withdrawal.'),
    result('analytics',analyticsDisabled?'NOT_APPLICABLE':analyticsReady?'PASS':'NEEDS_INPUT',[analyticsConfigured?'Analytics provider/measurement ID configured':'Customer-site analytics configuration not supplied',analyticsConsentAware?'Consent-aware runtime found':'Consent-aware tracking not confirmed',config.analyticsDeliveryVerified===true?'Browser event delivery verified':'Browser event delivery not verified'],'Ask the owner to configure analytics; verify events and consent behavior. Never infer customer analytics from platform analytics.'),
    result('contact-address',contactAddress?'PASS':'NEEDS_INPUT',[contactAddress?'Owner-supplied contact address present':'Real contact address required from site owner'],'Request a real business address from the owner. Never invent an address.'),
    result('compressed-images',images.length===0&&!/background-image\s*:\s*url\(/i.test(cssText)?'NOT_APPLICABLE':imageAssets.length>0&&imageAssets.every(([,asset])=>asset.sizeBytes>0&&asset.sizeBytes<=300000&&(/image\/(?:avif|webp)/i.test(asset.contentType||'')||/\.(?:avif|webp)$/i.test(asset.name||'')))?'PASS':'NEEDS_INPUT',['Image elements: '+images.length,'Image assets with measurable metadata: '+imageAssets.length,'Optimization requires byte-size and format evidence'],'Integrate image optimization into generation/export and verify formats, dimensions, byte budgets, and visual quality.'),
  ];
  const normalized=checks.map(check=>({...check,status:STATUSES.has(check.status)?check.status:'FAIL',severity:check.id==='analytics'&&config.analyticsEnabled===true?'critical':GENERATED_SITE_REQUIREMENTS.find(item=>item.id===check.id)?.severity||'medium'}));
  const summary={total:normalized.length,pass:normalized.filter(x=>x.status==='PASS').length,fail:normalized.filter(x=>x.status==='FAIL').length,needsInput:normalized.filter(x=>x.status==='NEEDS_INPUT').length,notApplicable:normalized.filter(x=>x.status==='NOT_APPLICABLE').length};
  return {version:'generated-site-quality.v1',generatedAt:new Date().toISOString(),baseUrl:baseUrl||null,summary,publishable:!normalized.some(item=>item.severity==='critical'&&item.status!=='PASS'&&item.status!=='NOT_APPLICABLE'),requirements:normalized};
}

function result(id,status,evidence=[],remediation='') {
  return {id,status,evidence:[...evidence].filter(Boolean),remediation};
}
