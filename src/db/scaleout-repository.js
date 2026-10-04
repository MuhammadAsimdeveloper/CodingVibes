import crypto from 'node:crypto';

export class PostgresScaleoutRepository{
 constructor(db){if(!db?.query||!db?.transaction)throw new Error('postgres_database_required');this.db=db;}
 async enqueueOutbox({topic,payload,availableAt=new Date()}={}){
  if(!topic||payload===undefined)throw new Error('outbox_topic_and_payload_required');
  const id=crypto.randomUUID();
  const result=await this.db.query('INSERT INTO codingvibes_outbox(id,topic,payload,available_at) VALUES($1,$2,$3,$4) RETURNING id,topic,payload,status,attempts,available_at',[id,String(topic).slice(0,200),payload,availableAt]);
  return row(result.rows[0]);
 }
 async claimOutbox({workerId,limit=10,leaseSeconds=60}={}){
  const owner=String(workerId||'worker-'+process.pid).slice(0,120);const count=Math.max(1,Math.min(Number(limit)||10,100));
  return this.db.transaction(async client=>{
   const picked=await client.query('SELECT id FROM codingvibes_outbox WHERE status=\'pending\' AND available_at<=now() ORDER BY available_at ASC,created_at ASC FOR UPDATE SKIP LOCKED LIMIT $1',[count]);
   const ids=picked.rows.map(x=>x.id);if(!ids.length)return[];
   const updated=await client.query('UPDATE codingvibes_outbox SET status=\'processing\',locked_at=now(),locked_by=$1,attempts=attempts+1,updated_at=now() WHERE id=ANY($2::uuid[]) RETURNING id,topic,payload,status,attempts,available_at,locked_at,locked_by',[owner,ids]);
   return updated.rows.map(row);
  });
 }
 async completeOutbox(id){const r=await this.db.query('UPDATE codingvibes_outbox SET status=\'complete\',locked_at=NULL,locked_by=NULL,updated_at=now() WHERE id=$1 RETURNING id,status',[id]);return r.rows[0]||null;}
 async failOutbox(id,error,{retryAt=new Date(Date.now()+30000),dead=false}={}){const status=dead?'dead':'pending';const r=await this.db.query('UPDATE codingvibes_outbox SET status=$2,last_error=$3,locked_at=NULL,locked_by=NULL,available_at=$4,updated_at=now() WHERE id=$1 RETURNING id,status,attempts,available_at',[id,status,String(error||'unknown').slice(0,1000),retryAt]);return r.rows[0]||null;}
 async saveObjectRef({id=crypto.randomUUID(),objectKey,provider,bucket=null,sizeBytes,sha256,contentType=null,metadata={}}={}){if(!objectKey||!provider||!Number.isFinite(Number(sizeBytes))||!sha256)throw new Error('object_reference_required');const r=await this.db.query('INSERT INTO codingvibes_object_refs(id,object_key,provider,bucket,size_bytes,sha256,content_type,metadata) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(object_key) DO UPDATE SET provider=EXCLUDED.provider,bucket=EXCLUDED.bucket,size_bytes=EXCLUDED.size_bytes,sha256=EXCLUDED.sha256,content_type=EXCLUDED.content_type,metadata=EXCLUDED.metadata,updated_at=now() RETURNING *',[id,objectKey,provider,bucket,Number(sizeBytes),sha256,contentType,metadata]);return r.rows[0];}
 async audit({id=crypto.randomUUID(),actorUserId=null,action,resourceType,resourceId=null,metadata={}}={}){if(!action||!resourceType)throw new Error('audit_action_and_resource_type_required');const r=await this.db.query('INSERT INTO codingvibes_audit_events(id,actor_user_id,action,resource_type,resource_id,metadata) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[id,actorUserId,action,resourceType,resourceId,metadata]);return r.rows[0];}
}
function row(value){if(!value)return null;return {...value,payload:typeof value.payload==='string'?JSON.parse(value.payload):value.payload};}