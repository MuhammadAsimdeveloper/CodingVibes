import test from 'node:test';
import assert from 'node:assert/strict';
import {retentionConfig,applyRetention} from '../src/ops/retention.js';

test('retention configuration is bounded and cleanup is explicit',()=>{
  const config=retentionConfig({CODINGVIBES_ANALYTICS_RETENTION_DAYS:'90',CODINGVIBES_AUDIT_RETENTION_DAYS:'365'});
  assert.equal(config.analyticsDays,90);
  assert.equal(config.auditDays,365);
  assert.equal(config.dryRun,false);
  const calls=[];
  const store={purgeOldProductEvents:days=>calls.push(['analytics',days]),purgeOldAuditLogs:days=>calls.push(['audit',days])};
  const result=applyRetention(store,config);
  assert.deepEqual(calls,[['analytics',90],['audit',365]]);
  assert.equal(result.status,'APPLIED');
});
