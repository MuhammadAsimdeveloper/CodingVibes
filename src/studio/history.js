export function buildProjectHistory(store,projectId,userId,{messageLimit=80,runLimit=30}={}){
  const sessions=store.listSessions(projectId,userId);
  return{projectId,sessions:sessions.map(session=>{
    const messages=store.listMessages(session.id,userId).slice(-messageLimit);
    const runs=store.listRuns(session.id,userId).slice(0,runLimit);
    return{...session,messages,runs,latestRun:runs[0]||null};
  })};
}