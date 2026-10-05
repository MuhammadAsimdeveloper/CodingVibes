import {createPostgresDatabase,ensurePostgresMigrations} from '../db/postgres.js';
import {PostgresScaleoutRepository} from '../db/scaleout-repository.js';
import {createObjectStore} from '../storage/object-store.js';
import {createJobQueue} from '../jobs/queue.js';
import {OutboxRelay} from '../jobs/outbox-relay.js';
import {scaleOutConfig} from '../platform/scaleout.js';
import {Store} from '../db/store.js';

function sanitizeError(error){return String(error?.message||error||'unknown').replace(/[\r\n]+/g,' ').slice(0,500);}

export class BackendRuntime{
  constructor({store=null,env=process.env,logger=console}={}){
    this.env=env;
    this.logger=logger;
    this.store=store||new Store(env.DATABASE_PATH||undefined);
    this.ownsStore=!store;
    this.config=scaleOutConfig(env);
    this.database=null;
    this.objectStore=null;
    this.queue=null;
    this.repository=null;
    this.relay=null;
    this.relayTask=null;
    this.initialized=false;
    this.closed=false;
  }

  async init(){
    if(this.initialized)return this;
    if(!this.config.ready)throw new Error('backend_configuration_invalid:'+this.config.blockers.join(','));
    if(this.config.database.backend==='postgres'){
      this.database=createPostgresDatabase({
        connectionString:this.env.DATABASE_URL,
        sslMode:this.env.CODINGVIBES_PG_SSL_MODE,
        max:this.env.CODINGVIBES_PG_POOL_MAX,
        applicationName:'build-vibe'
      });
      await ensurePostgresMigrations(this.database);
      this.repository=new PostgresScaleoutRepository(this.database);
    }
    const objectRoot=this.env.CODINGVIBES_OBJECT_ROOT||undefined;
    this.objectStore=await createObjectStore({
      backend:this.config.objectStorage.backend,
      root:objectRoot,
      bucket:this.env.CODINGVIBES_OBJECT_BUCKET,
      region:this.env.CODINGVIBES_OBJECT_REGION,
      endpoint:this.env.CODINGVIBES_OBJECT_ENDPOINT
    });
    this.queue=await createJobQueue({
      backend:this.config.queue.backend,
      url:this.env.CODINGVIBES_REDIS_URL,
      stream:this.env.CODINGVIBES_REDIS_STREAM,
      group:this.env.CODINGVIBES_REDIS_GROUP,
      consumer:this.env.HOSTNAME||undefined
    });
    if(this.repository&&this.queue){
      this.relay=new OutboxRelay({
        repository:this.repository,
        queue:this.queue,
        workerId:this.env.HOSTNAME||('relay-'+process.pid),
        batchSize:Number(this.env.CODINGVIBES_OUTBOX_BATCH_SIZE||20),
        intervalMs:Number(this.env.CODINGVIBES_OUTBOX_INTERVAL_MS||1000),
        logger:this.logger
      });
      this.relayTask=this.relay.start().catch(error=>this.logger.error?.('backend_outbox_relay_stopped',sanitizeError(error)));
    }
    this.initialized=true;
    return this;
  }

  async healthcheck(){
    if(this.closed)return {ok:false,status:'closed'};
    const checks={
      database:this.database?await this.database.healthcheck():this.config.database.backend==='sqlite',
      objectStorage:this.objectStore?await this.objectStore.healthcheck():false,
      queue:this.queue?await this.queue.healthcheck():false
    };
    return {ok:Object.values(checks).every(Boolean),checks};
  }

  async status(){
    const health=await this.healthcheck();
    return {
      ok:health.ok,
      initialized:this.initialized,
      mode:this.config.database.backend==='postgres'?'postgres-control-plane':'sqlite',
      database:{backend:this.config.database.backend,configured:this.config.database.backend==='sqlite'||this.config.database.configured,connected:Boolean(this.database)||this.config.database.backend==='sqlite'},
      objectStorage:{backend:this.config.objectStorage.backend,configured:this.config.objectStorage.configured,connected:Boolean(this.objectStore)},
      queue:{backend:this.config.queue.backend,configured:this.config.queue.configured,connected:Boolean(this.queue)},
      outbox:{enabled:Boolean(this.repository&&this.relay),running:Boolean(this.relayTask&&!this.relay?.stopping)},
      checks:health.checks,
      blockers:this.config.blockers,
    };
  }

  async audit({actorUserId=null,action,resourceType,resourceId=null,metadata={}}={}){
    const local=this.store.addAuditLog({actorUserId,action,resourceType,resourceId,metadata});
    if(this.repository){
      try{await this.repository.audit({actorUserId,action,resourceType,resourceId,metadata});}
      catch(error){this.logger.error?.('backend_audit_replication_failed',sanitizeError(error));}
    }
    return local;
  }

  async putObject({key,body,contentType='application/octet-stream',metadata={}}={}){
    if(!this.initialized)await this.init();
    const saved=await this.objectStore.put({key,body,contentType,metadata});
    const ref=this.store.saveBackendObjectRef({
      objectKey:saved.key,
      provider:saved.provider||this.objectStore.provider,
      bucket:saved.bucket||this.objectStore.bucket||null,
      sizeBytes:saved.size,
      sha256:saved.sha256,
      contentType:saved.contentType||contentType,
      metadata:saved.metadata||metadata
    });
    if(this.repository){
      try{await this.repository.saveObjectRef({objectKey:ref.object_key,provider:ref.provider,bucket:ref.bucket,sizeBytes:ref.size_bytes,sha256:ref.sha256,contentType:ref.content_type,metadata:ref.metadata});}
      catch(error){this.logger.error?.('backend_object_ref_replication_failed',sanitizeError(error));}
    }
    return {key:saved.key,size:saved.size,sha256:saved.sha256,contentType:saved.contentType,metadata:saved.metadata,reference:ref};
  }

  async getObject({key}={}){if(!this.initialized)await this.init();return this.objectStore.get({key});}
  async deleteObject({key}={}){if(!this.initialized)await this.init();const result=await this.objectStore.delete({key});return result;}

  async enqueue({id,type,payload,availableAt}={}){
    if(!this.initialized)await this.init();
    if(this.repository)return this.repository.enqueueOutbox({topic:type,payload,availableAt});
    return this.queue.enqueue({id,type,payload});
  }

  async close(){
    if(this.closed)return;
    this.closed=true;
    try{this.relay?.stop();if(this.relayTask)await Promise.race([this.relayTask,new Promise(resolve=>setTimeout(resolve,1000))]);}catch{}
    try{await this.queue?.close();}catch{}
    try{await this.database?.close();}catch{}
    if(this.ownsStore)try{this.store.close();}catch{}
  }
}
