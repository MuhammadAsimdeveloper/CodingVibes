import {assessDeploymentPreflight} from '../src/deployment/preflight.js';

const provider=String(process.env.CODINGVIBES_DEPLOY_PROVIDER||'').trim();
const targetId=String(process.env.CODINGVIBES_DEPLOY_TARGET||process.env.CODINGVIBES_TARGET||'web-node');
const result=assessDeploymentPreflight({provider,targetId,env:process.env,workspace:process.env.CODINGVIBES_DEPLOY_WORKSPACE||null});
console.log(JSON.stringify(result,null,2));
process.exitCode=result.status==='BLOCKED'?2:0;
