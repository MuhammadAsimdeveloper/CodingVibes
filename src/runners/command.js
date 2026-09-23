import {spawn} from 'node:child_process';
import path from 'node:path';

const ALLOWED = new Set(['node','npm','npx','gradle','java','adb','flutter','dart','swift','xcodebuild','cargo','rustc','eas','bash','gradlew','gradlew.bat']);
const MAX_OUTPUT = 120_000;
const SAFE_ENV_KEYS = new Set(['CI','PATH','HOME','TMPDIR','TMP','TEMP','LANG','LC_ALL','NO_COLOR','DEBIAN_FRONTEND','ANDROID_HOME','ANDROID_SDK_ROOT','JAVA_HOME','GRADLE_USER_HOME','PUB_CACHE','FLUTTER_ROOT','DART_SDK','CARGO_HOME','RUSTUP_HOME','NPM_CONFIG_CACHE','COREPACK_HOME']);
const SAFE_ENV_PREFIXES=['ANDROID_','JAVA_','GRADLE_','FLUTTER_','DART_','PUB_','CARGO_','RUST_','NPM_CONFIG_','COREPACK_','LC_'];

export function commandName(command){const base=path.basename(String(command||''));return base.endsWith('.bat')?base.slice(0,-4):base;}
function safeEnvironment(explicit={},includeProcessEnv=true){
  const env={};if(includeProcessEnv){for(const [key,value] of Object.entries(process.env)){if(SAFE_ENV_KEYS.has(key)||SAFE_ENV_PREFIXES.some(prefix=>key.startsWith(prefix)))env[key]=value;}}
  for(const [key,value] of Object.entries(explicit||{})){if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key))continue;env[key]=String(value);}
  return env;
}

export function runCommand(command,args=[],{cwd,env={},includeProcessEnv=true,timeoutMs=15*60_000,allowlist=ALLOWED,signal}={}){
  const name=commandName(command);
  if(!allowlist.has(name))return Promise.resolve({ok:false,code:126,signal:null,stdout:'',stderr:`command not allowed: ${name}`,durationMs:0});
  return new Promise(resolve=>{
    const started=Date.now();let cancelled=false;const child=spawn(command,args,{cwd,env:safeEnvironment(env,includeProcessEnv),stdio:['ignore','pipe','pipe'],shell:false});
    let stdout='',stderr='',timedOut=false;
    child.stdout.on('data',d=>{stdout=(stdout+d).slice(-MAX_OUTPUT)});child.stderr.on('data',d=>{stderr=(stderr+d).slice(-MAX_OUTPUT)});
    const timer=setTimeout(()=>{timedOut=true;child.kill('SIGTERM');setTimeout(()=>child.kill('SIGKILL'),2000).unref()},timeoutMs);
    const abort=()=>{cancelled=true;try{child.kill('SIGTERM')}catch{}setTimeout(()=>{try{child.kill('SIGKILL')}catch{}},1000).unref()};
    if(signal){if(signal.aborted){abort();return resolve({ok:false,code:130,signal:'SIGTERM',stdout:'',stderr:'run cancelled',durationMs:Date.now()-started,cancelled:true});}signal.addEventListener('abort',abort,{once:true});}
    child.on('error',e=>{clearTimeout(timer);if(signal)signal.removeEventListener('abort',abort);resolve({ok:false,code:127,signal:null,stdout,stderr:`${stderr}${e.message}`,durationMs:Date.now()-started,timedOut,cancelled})});
    child.on('close',(code,childSignal)=>{clearTimeout(timer);if(signal)signal.removeEventListener('abort',abort);resolve({ok:code===0&&!timedOut&&!cancelled,code,signal:childSignal,stdout,stderr:cancelled&&!stderr?`${stderr}run cancelled`:stderr,durationMs:Date.now()-started,timedOut,cancelled})});
  });
}
