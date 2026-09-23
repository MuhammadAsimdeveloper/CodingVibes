import {randomUUID} from 'node:crypto';

export const TASK_DEFINITIONS = [
  ['requirements','Understand requirements',[], 'planning'],
  ['context','Index repository context',['requirements'],'context'],
  ['architecture','Create application plan',['requirements','context'],'planning'],
  ['generation','Generate implementation',['architecture'],'generation'],
  ['verification','Build and verify',['generation'],'verification'],
  ['repair','Repair verification failures',['verification'],'repair'],
  ['review','Prepare reviewable changeset',['verification','repair'],'review'],
  ['ready','Ready for commit/deploy',['review'],'lifecycle']
];

export function createTaskGraph(store, runId, targetId='web-node') {
  const tasks = TASK_DEFINITIONS.map(([key,title,deps,phase], i) => store.createTask({
    id: randomUUID(), runId, key, title, phase, dependencies: deps,
    status: i === 0 ? 'running' : 'pending', metadata: {targetId}
  }));
  return tasks;
}

export function transitionTask(store, runId, key, status, metadata={}) {
  const task = store.getTaskByKey(runId,key);
  if (!task) return null;
  const patch = {status, metadata:{...(task.metadata||{}),...metadata}};
  if (status === 'running' && !task.started_at) patch.started_at = new Date().toISOString();
  if (['succeeded','failed','blocked','cancelled'].includes(status)) patch.finished_at = new Date().toISOString();
  return store.updateTask(task.id, patch);
}

export function cancelTaskGraph(store,runId,reason='run_cancelled'){
  for(const task of store.listTasks(runId)){
    if(['pending','running'].includes(task.status)) transitionTask(store,runId,task.key,'cancelled',{reason});
  }
}

export function syncTaskForEvent(store, runId, event, payload={}) {
  const map = {
    context_loaded:['context','succeeded'], planned:['architecture','succeeded'], changeset_proposed:['generation','running'],
    changes_applied:['generation','succeeded'], verification:['verification',payload.passed?'succeeded':'failed'],
    target_verification:['verification',payload.passed?'succeeded':'failed'], repair_requested:['repair','running'],
    repair_applied:['repair','succeeded'], repair_error:['repair','failed'], completed:['ready',payload.status==='verified'?'succeeded':'blocked']
  };
  const hit=map[event]; if(!hit) return;
  if(event==='planned') transitionTask(store,runId,'requirements','succeeded',payload);
  transitionTask(store,runId,hit[0],hit[1],payload);
  if(event==='verification' || event==='target_verification'){
    if(payload.passed) transitionTask(store,runId,'repair','succeeded',{skipped:true,reason:'verification_passed'});
    else transitionTask(store,runId,'repair','running',{reason:'verification_failed'});
  }
  const current=store.getTaskByKey(runId,hit[0]);
  if(event==='review_completed' && payload.passed) transitionTask(store,runId,'ready','running',{reason:'review_passed'});
  if(current?.status==='succeeded') {
    const next=store.listTasks(runId).find(t=>t.status==='pending' && t.dependencies?.every(d=>['succeeded'].includes(store.getTaskByKey(runId,d)?.status)));
    if(next) transitionTask(store,runId,next.key,'running');
  }
}
