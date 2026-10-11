import {verifyDeploymentCredential} from '../src/deployment/credential-check.js';

const provider=String(process.env.CODINGVIBES_DEPLOY_PROVIDER||'').trim();
const result=await verifyDeploymentCredential(provider,{env:process.env});
console.log(JSON.stringify(result,null,2));
if(!['PASS','NOT_REQUIRED'].includes(result.status)){
  console.error('Deployment credential verification is not complete. Resolve the listed blockers or warnings before a production deployment.');
  process.exitCode=2;
}
