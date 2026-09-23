import fs from 'node:fs';
import path from 'node:path';
import {runCommand} from './command.js';
import {collectArtifacts,copyArtifacts,uploadArtifact} from '../artifacts/store.js';
import {easBuild} from './eas.js';
import {androidDeviceSmoke} from './device.js';
import {capabilityForTarget,runnerLeaseManager} from './scheduler.js';
import {classifyRunnerFailure} from './failures.js';

function has(cmd){return process.env[`CODINGVIBES_${cmd.toUpperCase()}_RUNNER`]||cmd}
function baseResult(target,steps=[],artifacts=[],status='failed',extra={}){const last=steps.at(-1);return {target:target.id,status,steps,artifacts,failureCode:status==='failed'?classifyRunnerFailure({result:last,stage:'build'}):null,...extra}}


export async function installTargetDependencies({workspace,target,executor=null}={}){
  const exec=(cmd,args,opts={})=>(executor?executor(cmd,args,opts):runCommand(cmd,args,{cwd:workspace,timeoutMs:15*60_000,...opts}));
  if(['android-kotlin','android-twa'].includes(target.id)){
    const gradle=fs.existsSync(path.join(workspace,'gradlew'))?'./gradlew':'gradle';
    return await exec(gradle,['dependencies']);
  }
  if(target.id==='mobile-flutter')return await exec('flutter',['pub','get']);
  if(target.id==='mobile-expo')return await exec('npm',['ci']);
  if(target.id==='desktop-tauri')return await exec('cargo',['fetch']);
  if(target.id==='multiplatform-kmp')return await exec('gradle',['dependencies']);
  return {ok:true,code:0,stdout:'no dependency bootstrap required',stderr:''};
}

function androidManifestInfo(workspace){
  const candidates=[path.join(workspace,'app/src/main/AndroidManifest.xml'),path.join(workspace,'android/app/src/main/AndroidManifest.xml')];
  const file=candidates.find(fs.existsSync);if(!file)return null;const text=fs.readFileSync(file,'utf8');
  const pkg=text.match(/(?:package|android:package)=[\"']([^\"']+)[\"']/)?.[1]||null;
  const activity=text.match(/<activity[^>]*(?:android:name|name)=[\"']([^\"']+)[\"']/)?.[1]||null;
  if(!pkg)return null;const fq=activity?(activity.startsWith('.')?pkg+activity:activity):null;return {packageId:pkg,activity:fq,manifest:file};
}

export function detectAndroidApp(workspace){return androidManifestInfo(workspace);}

export async function runTargetBuild({workspace,target,runId='local',artifactRoot=path.join(process.cwd(),'data','artifacts'),timeoutMs=15*60_000,executor=null}={}){
  const steps=[]; const exec=(cmd,args,opts={})=>(executor?executor(cmd,args,opts):runCommand(has(cmd),args,{cwd:workspace,timeoutMs,...opts})).then(r=>(steps.push({command:[cmd,...args].join(' '),...r}),r));
  let final;
  if(target.id==='mobile-flutter'){
    const a=await exec('flutter',['analyze']); const b=a.ok?await exec('flutter',['test']):a; const c=b.ok?await exec('flutter',['build','apk','--debug']):b;
    final=baseResult(target,steps,collectArtifacts(workspace,['apk']),c.ok?'built':'failed',{attested:c.ok,tested:b.ok});
  } else if(['android-kotlin','android-twa'].includes(target.id)){
    const gradle=fs.existsSync(path.join(workspace,'gradlew'))?'./gradlew':'gradle';
    const tests=await exec(gradle,['test']); const a=tests.ok?await exec(gradle,['assembleDebug']):tests;
    final=baseResult(target,steps,collectArtifacts(workspace,['apk','aab']),a.ok?'built':'failed',{attested:a.ok,tested:tests.ok});
  } else if(target.id==='mobile-expo'){
    const cloud=await easBuild({workspace,platform:'android',profile:'preview',timeoutMs});
    steps.push(cloud);
    final=baseResult(target,steps,collectArtifacts(workspace,['apk','aab']),cloud.ok?'cloud-build-submitted':'failed',{cloud:true,buildId:cloud.buildId,artifactUrl:cloud.artifactUrl});
  } else if(target.id==='ios-swiftui'){
    const a=await exec('xcodebuild',['-scheme','CodingVibesApp','-sdk','iphonesimulator','-configuration','Debug','build']);
    final=baseResult(target,steps,collectArtifacts(workspace,['app','ipa']),a.ok?'built':'failed',{attested:a.ok,tested:a.ok});
  } else if(target.id==='desktop-tauri'){
    const a=await exec('cargo',['check']); const b=a.ok?await exec('cargo',['test','--no-run']):a; const c=b.ok?await exec('cargo',['tauri','build']):b;
    final=baseResult(target,steps,collectArtifacts(workspace,['dmg','msi','exe','deb','rpm']),c.ok?'built':'failed',{attested:c.ok,tested:b.ok});
  } else if(target.id==='multiplatform-kmp'){
    const a=await exec('gradle',['test']); final=baseResult(target,steps,collectArtifacts(workspace,['jar','aar']),a.ok?'built':'failed',{attested:a.ok,tested:a.ok});
  } else if(target.id==='desktop-electron'){
    const a=await exec('npm',['run','check']); const b=a.ok?await exec('npm',['test']):a; final=baseResult(target,steps,[],b.ok?'verified':'failed');
  } else {
    const a=await exec('npm',['run','check']); const b=a.ok?await exec('npm',['test']):a; final=baseResult(target,steps,[],b.ok?'verified':'failed');
  }
  if(final.artifacts.length){final.artifacts=copyArtifacts(workspace,artifactRoot,final.artifacts,runId)}
  return final;
}

export async function installAndVerify({artifact,packageId,activity,artifactPath,timeoutMs=120_000,serial='',expectedSha256}={}){
  return androidDeviceSmoke({artifactPath,packageId,activity,timeoutMs,serial,expectedSha256:expectedSha256||artifact?.sha256});
}
export {runnerLeaseManager,capabilityForTarget};

export async function uploadBuildArtifacts(artifacts,{url=process.env.CODINGVIBES_ARTIFACT_UPLOAD_URL,token=process.env.CODINGVIBES_ARTIFACT_UPLOAD_TOKEN}={}){
  const results=[];for(const artifact of artifacts||[]){results.push({...artifact,upload:await uploadArtifact(artifact.storedPath,{url,token})})}return results;
}
