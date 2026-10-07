const BUSY_STATUSES=new Set(['building','dependency_install','verifying','repairing','preview']);
const TERMINAL_STATUSES=new Set(['verified','failed','blocked','cancelled','error','ready']);

export function createStudioState(){
  return {windows:new Map(),builds:new Map()};
}

export function registerProjectWindow(state,{id,name,status='ready',runId=null}={}){
  const key=String(id||'');
  if(!key)throw new Error('project_id_required');
  const current=state.windows.get(key)||{};
  state.windows.set(key,{...current,id:key,name:String(name||current.name||key),status:String(status||current.status||'ready'),runId:runId||current.runId||null});
  return state.windows.get(key);
}

export function beginProjectBuild(state,projectId,runId=null){
  const key=String(projectId||'');
  if(!key)throw new Error('project_id_required');
  const window=registerProjectWindow(state,{id:key});
  state.builds.set(key,{projectId:key,runId:runId?String(runId):null});
  state.windows.set(key,{...window,status:'building',runId:runId?String(runId):window.runId||null});
  return state.windows.get(key);
}

export function routeBuildEvent(state,projectId,event={}){
  const key=String(projectId||'');
  const window=registerProjectWindow(state,{id:key});
  const type=String(event.type||'');
  let status=window.status;
  let runId=window.runId;
  if(type==='run_created'){
    runId=String(event.runId||event.result?.runId||runId||'')||null;
    status='building';
  }else if(type==='preview_started')status='preview';
  else if(type==='verification')status=event.passed?'verified':'repairing';
  else if(type==='repair_requested')status='repairing';
  else if(type==='completed'){
    runId=String(event.result?.runId||event.runId||runId||'')||null;
    status=String(event.result?.status||event.status||(event.passed?'verified':'failed'));
    state.builds.delete(key);
  }else if(type==='target_verification'){
    runId=String(event.result?.runId||event.runId||runId||'')||null;
    if(event.passed){status=String(event.result?.status||event.status||'verified');state.builds.delete(key);}
    else status='repairing';
  }else if(type==='error'){status='error';state.builds.delete(key);}
  state.windows.set(key,{...window,status,runId});
  return {window:state.windows.get(key),terminal:TERMINAL_STATUSES.has(status),busy:BUSY_STATUSES.has(status)};
}

export function finishProjectBuild(state,projectId,status='ready'){
  const key=String(projectId||'');
  state.builds.delete(key);
  const window=registerProjectWindow(state,{id:key});
  state.windows.set(key,{...window,status:String(status||'ready')});
  return state.windows.get(key);
}

export function isProjectBuilding(state,projectId){
  return state.builds.has(String(projectId||''));
}

export function visibleProjectWindows(state,limit=8){
  const count=Math.max(1,Math.min(Number(limit)||8,24));
  return [...state.windows.values()].slice(0,count);
}
