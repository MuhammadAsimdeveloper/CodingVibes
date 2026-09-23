function push(out,{severity='low',category,title,message,evidence=null,nextAction=null,path=null}){
  out.push({id:`${category}:${title}`.toLowerCase().replace(/[^a-z0-9]+/g,'-'),severity,category,title,message,evidence,nextAction,path});
}

export function buildDiagnostics({run={},evidence=[],usage=null,review=null,inspect=null}={}){
  const findings=[];
  const ver=[...evidence].filter(x=>x.type==='verification').at(-1)?.payload;
  const browser=ver?.browser;
  const debug=browser?.debug;
  const failures=Array.isArray(ver?.failures)?ver.failures:[];
  for(const failure of failures.slice(0,20))push(findings,{severity:'high',category:'verification',title:'verification-failure',message:String(failure),evidence:{attempt:ver?.attempt??0},nextAction:'Inspect the verification evidence and run a bounded repair cycle.'});
  if(browser?.available&&debug){
    if(Number(debug.consoleErrors||0)>0)push(findings,{severity:'high',category:'browser',title:'console-errors',message:`Browser verification captured ${debug.consoleErrors} console error(s).`,evidence:debug,nextAction:'Open the affected route, inspect the browser console, and repair the first runtime error before addressing secondary failures.'});
    if(Number(debug.requestFailures||0)>0)push(findings,{severity:'high',category:'browser',title:'request-failures',message:`Browser verification captured ${debug.requestFailures} failed request(s).`,evidence:debug,nextAction:'Trace the first failed request to its route, API handler, or asset and verify the response contract.'});
    if(Number(debug.serverErrors||0)>0)push(findings,{severity:'high',category:'browser',title:'server-errors',message:`Browser verification captured ${debug.serverErrors} HTTP 5xx response(s).`,evidence:debug,nextAction:'Reproduce the first 5xx and inspect the corresponding server/API logs and input validation.'});
  }
  const lastReview=[...evidence].filter(x=>x.type==='review').at(-1)?.payload||review;
  for(const f of (lastReview?.blockingFindings||[]).slice(0,20))push(findings,{severity:f.severity||'high',category:f.category||'review',title:f.name||'blocking-review-finding',message:f.message||'Review blocked the run.',evidence:f.details||null,nextAction:f.path?`Inspect ${f.path}, remove the finding, then re-run verification.`:'Resolve the blocking review finding and re-run verification.',path:f.path||null});
  if(run.status==='edited'||run.status==='cancelled')push(findings,{severity:'medium',category:'lifecycle',title:'verification-required',message:`Run is ${run.status}; changes are not currently proven verified.`,nextAction:'Restore or edit the workspace, then run verification before committing.'});
  if(usage?.estimated_cost_usd==null&&Number(usage?.calls||0)>0)push(findings,{severity:'low',category:'usage',title:'pricing-unavailable',message:'Model usage was recorded but no deployment pricing table is configured.',nextAction:'Set CODINGVIBES_MODEL_PRICING_JSON to enable estimated cost reporting.'});
  if(inspect?.status?.stdout?.includes('ahead')||inspect?.status?.stdout?.includes('behind'))push(findings,{severity:'low',category:'git',title:'branch-state',message:'Git reports branch divergence from its upstream reference.',evidence:inspect.status.stdout,nextAction:'Review the branch state before pushing or opening a pull request.'});
  return {
    status:findings.some(x=>x.severity==='high'||x.severity==='critical')?'attention':findings.length?'advisory':'clean',
    summary:findings.length?`${findings.length} diagnostic finding${findings.length===1?'':'s'}`:'No diagnostic findings',
    findings,
    generatedAt:new Date().toISOString()
  };
}
