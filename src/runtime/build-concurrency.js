export class BuildConcurrency{
  constructor(limit=3){this.limit=Math.max(1,Math.min(8,Number(limit)||3));this.active=new Map();}
  count(userId){return this.active.get(String(userId))?.size||0}
  isBusy(userId,projectId){return Boolean(this.active.get(String(userId))?.has(String(projectId)))}
  acquire(userId,projectId,runId){const u=String(userId),p=String(projectId),map=this.active.get(u)||new Map();if(map.has(p)||map.size>=this.limit)return false;map.set(p,{projectId:p,runId:String(runId||'')});this.active.set(u,map);return true}
  release(userId,projectId){const u=String(userId),map=this.active.get(u);if(!map)return false;const removed=map.delete(String(projectId));if(!map.size)this.active.delete(u);return removed}
  runIds(userId){return [...(this.active.get(String(userId))||new Map()).values()].map(x=>x.runId).filter(Boolean)}
}