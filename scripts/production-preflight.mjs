import {readiness} from '../src/ops/readiness.js';
const r=readiness({router:{getStatus:()=>({configured:Boolean(process.env.CODINGVIBES_PROVIDER||process.env.OPENAI_API_KEY||process.env.ANTHROPIC_API_KEY),provider:process.env.CODINGVIBES_PROVIDER||null})}});
console.log(JSON.stringify(r,null,2));
if(!r.ready){console.error('\nLaunch preflight failed. Resolve every blocker above before public production launch.');process.exitCode=2;}
else console.log('\nLaunch preflight passed. The production configuration satisfies the server launch contract.');
