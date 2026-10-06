import {performance} from 'node:perf_hooks';

const SEO_KEYS=['titles','descriptions','canonicals','jsonLd','robots','sitemap'];
export function scoreBenchmarkScenario(scenario,spec){
  const targetId=typeof spec?.target==='string'?spec.target:spec?.target?.id;
  const web=String(scenario.targetId||'').startsWith('web');
  const checks={
    target:targetId===scenario.targetId,
    pages:Array.isArray(spec?.pages)&&spec.pages.length>0,
    acceptance:Array.isArray(spec?.acceptance)&&spec.acceptance.length>=2,
    seo:web?SEO_KEYS.every(k=>Boolean(spec?.seo?.[k] ?? (k==='jsonLd'&&spec?.seo?.structuredData))):true,
    shape:Number(spec?.version||0)===3||String(spec?.version||'')==='spec.v3'
  };
  const score=Math.round(Object.values(checks).filter(Boolean).length/Object.keys(checks).length*100);
  return{scenarioId:scenario.id,category:scenario.category||null,score,passed:score>=80,checks,expectedCapabilities:scenario.expectedCapabilities||[]};
}
export function benchmarkSummary(results=[]){
  const scores=results.map(x=>Number(x.score)||0),passed=results.filter(x=>x.passed).length,total=results.length;
  return{count:total,passed,failed:total-passed,passRate:total?Number((passed/total*100).toFixed(2)):0,averageScore:total?Number((scores.reduce((a,b)=>a+b,0)/total).toFixed(2)):0};
}
export async function runBenchmarkSuite(scenarios,planner,{concurrency=4}={}){
  const list=Array.isArray(scenarios)?scenarios:[],results=new Array(list.length);let cursor=0;const started=performance.now();
  const worker=async()=>{while(true){const i=cursor++;if(i>=list.length)return;const s=list[i],t=performance.now();try{const spec=await planner(s);const scored=scoreBenchmarkScenario(s,spec);results[i]={...scored,buildDurationMs:null,measurementStatus:'PLANNING_CONTRACT_ONLY',repairCycles:0,tokenCostUsd:null,defects:scored.passed?0:1,securityFindings:[],targetArtifactStatus:scored.checks.target?'not_executed':'mismatch',durationMs:Math.round((performance.now()-t)*100)/100};}catch(error){results[i]={scenarioId:s.id,category:s.category||null,score:0,passed:false,error:String(error?.message||error),checks:{},buildDurationMs:null,measurementStatus:'ERROR',repairCycles:0,tokenCostUsd:null,defects:1,securityFindings:[],targetArtifactStatus:'not_executed',durationMs:Math.round((performance.now()-t)*100)/100};}}};
  await Promise.all(Array.from({length:Math.min(Math.max(1,concurrency),Math.max(1,list.length||1))},worker));
  return{...benchmarkSummary(results),durationMs:Math.round((performance.now()-started)*100)/100,measurementStatus:'PLANNING_CONTRACT_ONLY',results};
}
