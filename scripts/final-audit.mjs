import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {BUILD_VIBE_VERSION} from '../src/version.js';
import {getMiroFishStatus} from '../src/integrations/mirofish.js';
import {assessDeploymentPreflight} from '../src/deployment/preflight.js';

const readJson=(p, fallback=null)=>{try{return JSON.parse(fs.readFileSync(p,'utf8'));}catch{return fallback;}};
const envStatus=(name,fallback='NOT_RUN')=>String(process.env[name]||fallback).toUpperCase();
let commitSha=process.env.GITHUB_SHA||'UNKNOWN';
try{if(commitSha==='UNKNOWN')commitSha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();}catch{}
const pkg=readJson(path.resolve('package.json'),{});
const lock=readJson(path.resolve('package-lock.json'),{});
const benchmark=readJson(path.resolve('artifacts','benchmark-results.json'),null);
const deployment=assessDeploymentPreflight({provider:process.env.CODINGVIBES_DEPLOY_PROVIDER||'',targetId:process.env.CODINGVIBES_DEPLOY_TARGET||'web-node',env:process.env});
const miro=getMiroFishStatus(process.env);
const gates={
  npmCi:envStatus('BUILD_VIBE_NPM_CI_STATUS'),
  tests:envStatus('BUILD_VIBE_TEST_STATUS'),
  coverage:envStatus('BUILD_VIBE_COVERAGE_STATUS'),
  staticCheck:envStatus('BUILD_VIBE_CHECK_STATUS'),
  securityCheck:envStatus('BUILD_VIBE_SECURITY_STATUS'),
  codeQL:envStatus('BUILD_VIBE_CODEQL_STATUS'),
  dependencyReview:envStatus('BUILD_VIBE_DEPENDENCY_REVIEW_STATUS','BLOCKED'),
  scaleout:envStatus('BUILD_VIBE_SCALEOUT_STATUS'),
  e2e:envStatus('BUILD_VIBE_E2E_STATUS'),
  browserE2E:envStatus('BUILD_VIBE_BROWSER_E2E_STATUS'),
  accessibility:envStatus('BUILD_VIBE_ACCESSIBILITY_STATUS'),
  visual:envStatus('BUILD_VIBE_VISUAL_STATUS'),
  launchCheck:envStatus('BUILD_VIBE_LAUNCH_STATUS'),
  loadTest:envStatus('BUILD_VIBE_LOAD_STATUS'),
  backupRestore:envStatus('BUILD_VIBE_RECOVERY_STATUS'),
  deployment:deployment.status,
  benchmark:benchmark?('PASS'):'NOT_RUN',
  mirofish:miro.status
};
const blockers=[];
if(gates.dependencyReview==='BLOCKED')blockers.push('GitHub Dependency Review cannot run while repository Dependency Graph is disabled');
if(deployment.status==='BLOCKED')blockers.push(...deployment.blockers);
if(gates.benchmark==='NOT_RUN')blockers.push('benchmark suite has not produced a result artifact');
const versionConsistent=pkg.name==='build-vibe'&&pkg.version===BUILD_VIBE_VERSION&&lock.name==='build-vibe'&&lock.version===BUILD_VIBE_VERSION;
if(!versionConsistent)blockers.push('release identity mismatch');
const requiredPass=['npmCi','tests','staticCheck','securityCheck','scaleout','e2e','browserE2E','launchCheck','loadTest','backupRestore'];
const overall=blockers.length?'BLOCKED':requiredPass.every(k=>gates[k]==='PASS')?'PASS':'BLOCKED';
const result={
  schema:'build-vibe.release-readiness.v1',
  version:BUILD_VIBE_VERSION,
  commitSha,
  auditedAt:new Date().toISOString(),
  overall,
  gates,
  releaseIdentity:{packageVersion:pkg.version,lockfileVersion:lock.version,consistent:versionConsistent},
  benchmark:benchmark?{count:benchmark.count,passRate:benchmark.passRate,averageScore:benchmark.averageScore,measurementStatus:benchmark.measurementStatus}:null,
  targets:{requested:process.env.CODINGVIBES_DEPLOY_TARGET||'web-node',deploymentProvider:process.env.CODINGVIBES_DEPLOY_PROVIDER||null,deploymentStatus:deployment.status,targetStatus:deployment.targetAvailability?.canBuild===false?'BLOCKED':'AVAILABLE_OR_WEB'},
  mirofish:miro,
  blockers,
  notes:[
    'External managed infrastructure is only marked ready when explicitly configured and health-checked.',
    'Benchmark metrics marked PLANNING_CONTRACT_ONLY are not presented as full-build duration evidence.',
    'NOT_CONFIGURED means an optional external integration has not been enabled; it is not represented as a successful run.'
  ]
};
fs.mkdirSync(path.resolve('artifacts'),{recursive:true});
fs.writeFileSync(path.resolve('artifacts','release-readiness.json'),JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(overall==='PASS')process.exitCode=0;else process.exitCode=2;
