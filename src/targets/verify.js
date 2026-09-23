import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

function commandExists(command){try{execFileSync(process.platform==='win32'?'where':'which',[command],{stdio:'ignore'});return true;}catch{return false;}}
function firstExisting(root,required){return required.every(rel=>fs.existsSync(path.join(root,rel)));}
function safeJson(root,rel){try{return JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));}catch{return null;}}

export function inspectTargetStructure(workspace,target){
  const missing=target.requiredFiles.filter(rel=>!fs.existsSync(path.join(workspace,rel)));
  const packageJson=safeJson(workspace,'package.json');
  const details={requiredFiles:target.requiredFiles,missing,packageJsonValid:Boolean(packageJson),rootExists:fs.existsSync(workspace)};
  if(target.family==='web' || target.id==='desktop-electron' || target.id==='desktop-tauri')details.hasEntrypoint=firstExisting(workspace,target.id==='desktop-electron'?['src/main.js','src/main.ts']:target.family==='web'?['app/server.js','index.html','package.json']:['src-tauri/Cargo.toml']);
  return {passed:missing.length===0&&details.rootExists,details};
}

export function inspectToolchain(target){
  const checks={node:commandExists('node'),npm:commandExists('npm')};
  if(target.id==='mobile-expo')Object.assign(checks,{expo:commandExists('expo')});
  if(target.id==='mobile-flutter')Object.assign(checks,{flutter:commandExists('flutter'),dart:commandExists('dart')});
  if(['android-kotlin','android-twa'].includes(target.id))Object.assign(checks,{java:commandExists('java'),gradle:commandExists('gradle'),adb:commandExists('adb')});
  if(target.id==='ios-swiftui')Object.assign(checks,{swift:commandExists('swift'),xcodebuild:commandExists('xcodebuild')});
  if(target.id==='desktop-tauri')Object.assign(checks,{rustc:commandExists('rustc'),cargo:commandExists('cargo'),node:commandExists('node')});
  if(target.id==='multiplatform-kmp')Object.assign(checks,{java:commandExists('java'),gradle:commandExists('gradle')});
  const required=target.id==='mobile-flutter'?['flutter','dart']:
    ['android-kotlin','android-twa'].includes(target.id)?['java','gradle']:
    target.id==='ios-swiftui'?['swift']:
    target.id==='desktop-tauri'?['rustc','cargo']:
    target.id==='multiplatform-kmp'?['java','gradle']:[];
  const missing=required.filter(k=>!checks[k]);
  return {available:missing.length===0,checks,required,missing};
}

export async function verifyTargetSource(workspace,target,{runner,execution=null,artifacts=[]}={}){
  const structure=inspectTargetStructure(workspace,target);
  const hostToolchain=inspectToolchain(target);
  const toolchain=runner?{...hostToolchain,available:true,missing:[]}:hostToolchain;
  const commands=[];
    const run=async(command,args=[])=>{if(!runner){return {ok:false,code:127,stdout:'',stderr:'isolated target runner required'};}const result=await runner(command,args);commands.push({...result,command:[command,...args].join(' ')});return result;};
  if(!structure.passed)return {passed:false,status:'failed',scope:'source',failures:[`Missing target files: ${structure.details.missing.join(', ')}`],structure,toolchain,commands,artifacts:[]};

  let sourceChecksPassed=true;
  const authoritativeBuild=Boolean(['built','verified'].includes(execution?.status) && execution?.attested===true && (execution?.tested!==false) && Array.isArray(execution?.artifacts) && execution.artifacts.length>0);
  if(authoritativeBuild){
    sourceChecksPassed=true;
  } else if(target.id==='web-node'||target.id==='web-pwa'){
    const a=await run('npm',['run','check']);const b=await run('npm',['test']);sourceChecksPassed=Boolean(a.ok&&b.ok);
  }else if(target.id==='desktop-electron'){
    const a=await run('npm',['run','check']);const b=await run('npm',['test']);sourceChecksPassed=Boolean(a.ok&&b.ok);
  }else if(target.id==='desktop-tauri'&&toolchain.available){
    const a=await run('cargo',['check']);sourceChecksPassed=Boolean(a.ok);
  }else if(target.id==='mobile-flutter'&&toolchain.available){
    const a=await run('flutter',['analyze']);const b=await run('flutter',['test']);sourceChecksPassed=Boolean(a.ok&&b.ok);
  }else if(target.id==='mobile-flutter'&&!toolchain.available)sourceChecksPassed=false;
  else if(['android-kotlin','android-twa'].includes(target.id)&&toolchain.available){
    const gradleFile=fs.existsSync(path.join(workspace,'gradlew'))?'./gradlew':'gradle';const a=await run(gradleFile.endsWith('gradlew')?gradleFile:'gradle',['assembleDebug']);sourceChecksPassed=Boolean(a.ok);
  }else if(['android-kotlin','android-twa'].includes(target.id)&&!toolchain.available)sourceChecksPassed=false;
  else if(target.id==='ios-swiftui'&&toolchain.available){
    const a=await run('swift',['build']);sourceChecksPassed=Boolean(a.ok);
  }else if(target.id==='ios-swiftui'&&!toolchain.available)sourceChecksPassed=false;
  else if(target.id==='multiplatform-kmp'&&toolchain.available){const a=await run('gradle',['test']);sourceChecksPassed=Boolean(a.ok);}
  else if(target.id==='multiplatform-kmp'&&!toolchain.available)sourceChecksPassed=false;
  else if(target.id==='mobile-expo'){
    // Expo projects are intentionally fail-closed when the mobile toolchain is absent.
    if(!toolchain.available)sourceChecksPassed=false;
    else {const a=await run('npx',['expo','export','--platform','android']);sourceChecksPassed=Boolean(a.ok);}
  }

  const failures=[];
  if(execution && execution.status && execution.status!=='failed') sourceChecksPassed = sourceChecksPassed && ['verified','built','cloud-build-submitted'].includes(execution.status);
  if(!sourceChecksPassed){
    if(!runner)failures.push('Isolated target runner is not configured; source structure was inspected but build execution was not performed');
    if(!runner && toolchain.missing.length)failures.push(`Target toolchain unavailable: ${toolchain.missing.join(', ')}`);
    else if(runner && !toolchain.available&&toolchain.required.length)failures.push(`Target toolchain unavailable: ${toolchain.missing.join(', ')}`);
    else if(runner)failures.push('Target source/build checks failed');
  }
  const scope=['web-node','web-pwa','desktop-electron'].includes(target.id)?'source+runtime':'target-build';
  const passed=structure.passed&&sourceChecksPassed; const artifactList=(execution?.artifacts||artifacts||[]); return {passed,status:passed?'verified':(toolchain.missing.length||(!runner&&target.native)?'blocked':'failed'),scope,executionAvailable:Boolean(runner||execution),failures,structure,toolchain,commands,execution,artifacts:target.artifactTypes.map(type=>({type,status:artifactList.some(a=>a.type===type||String(a.path||'').endsWith(`.${type}`))?'ready':passed?'not_required':'blocked'})).concat(artifactList)};
}
