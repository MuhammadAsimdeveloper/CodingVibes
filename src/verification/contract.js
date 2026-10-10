export function verifyContract(spec,evidence){
  const failures=[];
  const sourceText=String(evidence?.sourceText||'');
  if(!spec?.pages?.length)failures.push('No pages specified');
  if(!spec?.acceptance?.length)failures.push('No acceptance criteria');
  for(const x of evidence?.commands||[])if(x.code!==0)failures.push(`Command failed: ${x.command}`);
  if(evidence?.browser?.enabled&&(!evidence.browser.available||!evidence.browser.passed)){
    failures.push('Browser verification failed or unavailable');
    for(const page of evidence.browser.results||[])for(const failure of page.uiFailures||[])if(String(failure).startsWith('visual diff'))failures.push(`${page.path}: ${failure}`);
  }
  if(evidence?.http&&!evidence.http.passed)failures.push('HTTP verification failed');
  if(evidence?.productQuality?.blockingFindings?.length){
    for(const finding of evidence.productQuality.blockingFindings)failures.push(`Product quality: ${finding.message}`);
  }
  const siteQuality=evidence?.productQuality?.generatedSiteQuality;
  const siteQualityBlockers=(siteQuality?.requirements||[]).filter(item=>item.severity==='critical'&&!['PASS','NOT_APPLICABLE'].includes(item.status));
  const siteQualityEnforced=evidence?.enforceGeneratedSiteQuality===true;
  if(siteQualityEnforced&&siteQuality&&siteQualityBlockers.length)failures.push('Generated-site quality gate blocked: '+siteQualityBlockers.map(item=>item.id+'='+item.status).join(', '));
  if(spec.behavior?.payments){
    if(/cardNumber|cvv|cvc|rawCard/i.test(sourceText))failures.push('Payment implementation appears to handle raw card data directly');
    if(spec.behavior.paymentProvider==='stripe'&&!/stripe|checkout\/session/i.test(sourceText))failures.push('Stripe checkout integration is missing');
  }
  if(spec.styling?.visual?.threeD&&!/three|webgl|canvas|perspective|transform-style/i.test(sourceText))failures.push('Requested 3D/immersive layer is not represented in generated source');
  return{passed:failures.length===0,failures,generatedSiteQualityGate:{enforced:siteQualityEnforced,status:siteQuality?siteQuality.publishable?'PASS':siteQualityEnforced?'BLOCKED':'INFORMATIONAL':'NOT_APPLICABLE',blockers:siteQualityBlockers.map(item=>({id:item.id,status:item.status,severity:item.severity}))}};
}
