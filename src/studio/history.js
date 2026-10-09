export function buildProjectHistory(store,projectId,userId,{messageLimit=80,runLimit=30}={}){
  const sessions=store.listSessions(projectId,userId);
  return{projectId,sessions:sessions.map(session=>{
    const messages=store.listMessages(session.id,userId).slice(-messageLimit);
    const runs=store.listRuns(session.id,userId).slice(0,runLimit);
    return{...session,messages,runs,latestRun:runs[0]||null};
  })};
}export function undoLastContentEdit(store,projectId,userId){
 const revisions=store.listContentRevisions(projectId,userId);
 if(revisions.length<2)return null;
 const previousMeta=revisions[1],previous=store.getContentRevision(previousMeta.id,userId);
 if(!previous)return null;
 const content=JSON.parse(previous.content_json||'{}');
 const saved=store.upsertProjectContent(projectId,userId,content);
 const revision=store.createContentRevision(projectId,userId,saved,'draft');
 return{content:saved,revision,restoredFrom:previousMeta.version};
}
