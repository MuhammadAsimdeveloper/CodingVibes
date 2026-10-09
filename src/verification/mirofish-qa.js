function clampText(v,max=1200){return String(v??'').trim().slice(0,max)}
export function buildMiroFishQAScenario({request='',pages=[],acceptance=[],riskAreas=[]}={}){
  const criteria=[...new Set((Array.isArray(acceptance)?acceptance:[]).map(x=>clampText(x,240)).filter(Boolean))].slice(0,24);
  const risks=[...new Set((Array.isArray(riskAreas)?riskAreas:[]).map(x=>clampText(x,180)).filter(Boolean))].slice(0,12);
  return{
    version:'mirofish-qa.v1',
    objective:'Simulate likely user/reviewer reactions to this product before release.',
    seed:{type:'product-acceptance',request:clampText(request),pages:(Array.isArray(pages)?pages:[]).map(x=>clampText(x,160)).slice(0,60),criteria,risks},
    questions:criteria.map((criterion,i)=>({id:'qa-'+(i+1),question:'How likely is this requirement to be misunderstood, rejected, or abandoned in normal use?',criterion})),
    recommendedScenarios:['first-time user','mobile user','returning user','skeptical reviewer','accessibility-focused user'],
    nonBlocking:true
  };
}
export function normalizeMiroFishQAResult(result={}){
  const score=Number(result.score);
  return{status:String(result.status||'unknown').toUpperCase().slice(0,40),score:Number.isFinite(score)?Math.max(0,Math.min(100,Math.round(score*100)/100)):null,summary:clampText(result.summary||result.message||'',1600),risks:Array.isArray(result.risks)?result.risks.slice(0,20).map(x=>clampText(x,240)):[]};
}