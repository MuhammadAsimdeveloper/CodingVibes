import {inferTarget, getTarget} from './registry.js';

export function resolveBuildTarget(request, explicit='auto'){
  const target=inferTarget(request, explicit);
  if(!target)throw new Error(`Unsupported build target: ${explicit}`);
  return target;
}

export function normalizeTargetId(value){
  const v=String(value||'auto');
  return v==='auto'||getTarget(v)?v:'auto';
}
