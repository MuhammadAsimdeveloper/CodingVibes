import fs from 'node:fs';
import crypto from 'node:crypto';
import {runCommand} from './command.js';
import {classifyRunnerFailure} from './failures.js';

function validPackage(value){return /^[a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z0-9_]+)+$/.test(String(value||''));}
function validActivity(value){return /^[a-zA-Z][a-zA-Z0-9_.$]*(?:\.[a-zA-Z0-9_.$]+)*$/.test(String(value||''));}
function hashFile(file){const h=crypto.createHash('sha256');h.update(fs.readFileSync(file));return h.digest('hex');}

export async function androidDeviceSmoke({artifactPath,packageId,activity,serial='',timeoutMs=120_000,expectedSha256}={}){
  if(!artifactPath||!fs.existsSync(artifactPath))return {installed:false,verified:false,status:'blocked',reason:'APK path missing'};
  if(!validPackage(packageId))return {installed:false,verified:false,status:'blocked',reason:'invalid Android package id'};
  if(activity&&!validActivity(activity))return {installed:false,verified:false,status:'blocked',reason:'invalid Android activity'};
  const actualSha=hashFile(artifactPath);if(expectedSha256&&expectedSha256!==actualSha)return {installed:false,verified:false,status:'failed',reason:'artifact sha256 mismatch',expectedSha256,actualSha};
  const adbArgs=serial?['-s',serial]:[];const adb=(args,extra={})=>runCommand('adb',[...adbArgs,...args],{timeoutMs,...extra});
  const device=await adb(['wait-for-device']);if(!device.ok)return {installed:false,verified:false,status:'failed',failureCode:classifyRunnerFailure({result:device,stage:'device'}),device};
  const boot=await adb(['shell','getprop','sys.boot_completed']);if(!boot.ok||!boot.stdout.includes('1'))return {installed:false,verified:false,status:'failed',failureCode:'DEVICE_UNAVAILABLE',device,boot};
  const install=await adb(['install','-r',artifactPath]);if(!install.ok)return {installed:false,verified:false,status:'failed',failureCode:'DEVICE_INSTALL_FAILED',device,boot,install};
  const stop=await adb(['shell','am','force-stop',packageId]);
  const launch=activity?await adb(['shell','am','start','-W','-n',`${packageId}/${activity}`]):{ok:true,code:0,stdout:'',stderr:''};
  const pkg=await adb(['shell','pm','list','packages',packageId]);
  const activityState=activity?await adb(['shell','dumpsys','activity','activities']):{ok:true,code:0,stdout:'',stderr:''};
  const logcat=(!launch.ok||!pkg.stdout.includes(packageId))?await adb(['logcat','-d','-t','200'],{timeoutMs:30_000}):{ok:true,code:0,stdout:'',stderr:''};
  const verified=Boolean(install.ok&&launch.ok&&pkg.ok&&pkg.stdout.includes(packageId)&&(!activity||activityState.ok));
  return {installed:install.ok,verified,status:verified?'verified':'failed',failureCode:verified?null:'DEVICE_SMOKE_FAILED',serial:serial||null,artifactSha256:actualSha,device,boot,install,stop,launch,pkg,activityState,logcat};
}
