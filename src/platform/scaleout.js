import {postgresConfigStatus,createPostgresDatabase,ensurePostgresMigrations} from '../db/postgres.js';
import {createObjectStore} from '../storage/object-store.js';
import {createJobQueue} from '../jobs/queue.js';

export function scaleOutConfig(env=process.env){
 const database=postgresConfigStatus(env);
 const objectBackend=String(env.CODINGVIBES_OBJECT_BACKEND||'local').toLowerCase();
 const queueBackend=String(env.CODINGVIBES_QUEUE_BACKEND||'local').toLowerCase();
 const blockers=[];
 if(!['sqlite','postgres'].includes(database.backend))blockers.push('unsupported_database_backend');
 if(database.backend==='postgres'&&!database.configured)blockers.push('postgres_database_not_configured');
 if(!['local','s3'].includes(objectBackend))blockers.push('unsupported_object_storage_backend');
 if(objectBackend==='s3'&&!env.CODINGVIBES_OBJECT_BUCKET)blockers.push('s3_object_bucket_missing');
 if(!['local','redis'].includes(queueBackend))blockers.push('unsupported_queue_backend');
 if(queueBackend==='redis'&&!env.CODINGVIBES_REDIS_URL)blockers.push('redis_queue_url_missing');
 return {database,objectStorage:{backend:objectBackend,configured:objectBackend==='local'||Boolean(env.CODINGVIBES_OBJECT_BUCKET)},queue:{backend:queueBackend,configured:queueBackend==='local'||Boolean(env.CODINGVIBES_REDIS_URL)},ready:blockers.length===0,blockers};
}

export async function createScaleOutServices(options={}){
 const config=scaleOutConfig(options.env||process.env);if(!config.ready)throw new Error('scaleout_configuration_invalid:'+config.blockers.join(','));
 const services={config};
 if(config.database.backend==='postgres'){const db=createPostgresDatabase(options.database||{});await ensurePostgresMigrations(db);services.database=db;}
 services.objectStore=await createObjectStore({...(options.objectStorage||{}),backend:config.objectStorage.backend});
 services.queue=await createJobQueue({...(options.queue||{}),backend:config.queue.backend});
 return services;
}