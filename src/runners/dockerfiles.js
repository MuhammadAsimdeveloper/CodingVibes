export const TARGET_RUNNER_IMAGES={
  android:'ghcr.io/codingvibes/runner-android:2.6.0',
  flutter:'ghcr.io/codingvibes/runner-flutter:2.6.0',
  ios:'ghcr.io/codingvibes/runner-ios:2.6.0',
  rust:'ghcr.io/codingvibes/runner-rust:2.6.0',
};

export const RUNNER_RESOURCE_LIMITS={cpu:2,memory:'4g',pids:512,timeoutMs:15*60_000};
export function runnerPolicy(target,{phase='build'}={}){const dependencyPhase=phase==='dependencies';return {network:dependencyPhase?'named-controlled-egress':'none',readOnlySource:false,workspaceWritable:true,dropCapabilities:true,noNewPrivileges:true,pidsLimit:RUNNER_RESOURCE_LIMITS.pids,memory:RUNNER_RESOURCE_LIMITS.memory,cpu:RUNNER_RESOURCE_LIMITS.cpu,timeoutMs:RUNNER_RESOURCE_LIMITS.timeoutMs,target:target.id,phase};}
