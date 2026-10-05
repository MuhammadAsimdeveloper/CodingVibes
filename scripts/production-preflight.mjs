import {readiness} from '../src/ops/readiness.js';
import {BackendRuntime} from '../src/backend/runtime.js';

const r=readiness({router:{getStatus:()=>({configured:Boolean(process.env.CODINGVIBES_PROVIDER||process.env.OPENAI_API_KEY||process.env.ANTHROPIC_API_KEY),provider:process.env.CODINGVIBES_PROVIDER||null})}});
let backendStatus=null;
let backendError=null;
if(r.ready){
  const backend=new BackendRuntime();
  try{
    await backend.init();
    backendStatus=await backend.status();
    if(!backendStatus.ok){
      r.ready=false;
      r.blockers.push('backend_healthcheck_failed');
    }
  }catch(error){
    r.ready=false;
    backendError=String(error?.message||error);
    r.blockers.push('backend_initialization_failed');
  }finally{
    try{await backend.close();}catch{}
  }
}
console.log(JSON.stringify({...r,backend:backendStatus,backendError},null,2));
if(!r.ready){console.error('\nLaunch preflight failed. Resolve every blocker above before public production launch.');process.exitCode=2;}
else console.log('\nLaunch preflight passed. The production configuration satisfies the server launch contract.');
