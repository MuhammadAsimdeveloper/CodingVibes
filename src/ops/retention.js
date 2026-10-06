const bounded=(v,fallback,max=3650)=>Math.min(max,Math.max(1,Number(v)||fallback));
export function retentionConfig(env=process.env){
  return{
    analyticsDays:bounded(env.CODINGVIBES_ANALYTICS_RETENTION_DAYS,90),
    auditDays:bounded(env.CODINGVIBES_AUDIT_RETENTION_DAYS,3650),
    dryRun:String(env.CODINGVIBES_RETENTION_DRY_RUN||'false').toLowerCase()==='true'
  };
}
export function applyRetention(store,config=retentionConfig()){
  if(config.dryRun)return{status:'DRY_RUN',analyticsDays:config.analyticsDays,auditDays:config.auditDays};
  const analytics=store.purgeOldProductEvents(config.analyticsDays);
  const audit=store.purgeOldAuditLogs(config.auditDays);
  return{status:'APPLIED',analyticsDays:config.analyticsDays,auditDays:config.auditDays,analyticsDeleted:analytics,auditDeleted:audit};
}
