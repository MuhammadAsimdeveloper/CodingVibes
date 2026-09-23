export const RUNNER_FAILURES={
  BUSY:'RUNNER_BUSY',
  LEASE_TIMEOUT:'RUNNER_LEASE_TIMEOUT',
  AUTH_FAILED:'RUNNER_AUTH_FAILED',
  NETWORK_POLICY:'RUNNER_NETWORK_POLICY',
  TIMEOUT:'RUNNER_TIMEOUT',
  TOOLCHAIN_UNAVAILABLE:'TOOLCHAIN_UNAVAILABLE',
  DEPENDENCY_INSTALL:'DEPENDENCY_INSTALL_FAILED',
  BUILD:'BUILD_FAILED',
  ARTIFACT_MISSING:'ARTIFACT_MISSING',
  ARTIFACT_UPLOAD:'ARTIFACT_UPLOAD_FAILED',
  ARTIFACT_INTEGRITY:'ARTIFACT_INTEGRITY_FAILED',
  DEVICE_UNAVAILABLE:'DEVICE_UNAVAILABLE',
  DEVICE_INSTALL:'DEVICE_INSTALL_FAILED',
  DEVICE_SMOKE:'DEVICE_SMOKE_FAILED',
  MANIFEST_MISMATCH:'RUNNER_MANIFEST_MISMATCH',
  CONFIGURATION:'RUNNER_CONFIGURATION',
};

export function classifyRunnerFailure({error='',result=null,stage='build'}={}){
  const text=`${error} ${result?.stderr||''} ${result?.reason||''}`.toLowerCase();
  if(result?.timedOut||text.includes('timeout'))return RUNNER_FAILURES.TIMEOUT;
  if(text.includes('runner busy')||text.includes('lease timeout'))return RUNNER_FAILURES.BUSY;
  if(text.includes('unauthorized'))return RUNNER_FAILURES.AUTH_FAILED;
  if(text.includes('network')&&text.includes('unsafe'))return RUNNER_FAILURES.NETWORK_POLICY;
  if(text.includes('manifest mismatch')||text.includes('checksum mismatch'))return RUNNER_FAILURES.MANIFEST_MISMATCH;
  if(stage==='dependencies')return RUNNER_FAILURES.DEPENDENCY_INSTALL;
  if(stage==='device')return result?.installed===false?RUNNER_FAILURES.DEVICE_INSTALL:RUNNER_FAILURES.DEVICE_SMOKE;
  if(stage==='artifact-upload')return RUNNER_FAILURES.ARTIFACT_UPLOAD;
  if(stage==='artifact')return RUNNER_FAILURES.ARTIFACT_MISSING;
  if(stage==='toolchain')return RUNNER_FAILURES.TOOLCHAIN_UNAVAILABLE;
  return RUNNER_FAILURES.BUILD;
}
