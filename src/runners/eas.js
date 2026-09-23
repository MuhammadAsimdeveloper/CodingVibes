import {runCommand} from './command.js';
export async function easBuild({workspace,platform='android',profile='preview',timeoutMs=30*60_000}={}){
  const result=await runCommand('eas',['build','--platform',platform,'--profile',profile,'--non-interactive','--json'],{cwd:workspace,timeoutMs});
  let payload=null;try{payload=JSON.parse(result.stdout)}catch{}
  const item=Array.isArray(payload)?payload[0]:payload;
  return {ok:result.ok,command:'eas build',platform,profile,status:result.ok?'submitted':'failed',buildId:item?.id||null,artifactUrl:item?.artifacts?.buildUrl||item?.artifacts?.applicationArchiveUrl||null,raw:result.stdout,stderr:result.stderr};
}
