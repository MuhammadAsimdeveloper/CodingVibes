import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createScaleOutServices} from '../src/platform/scaleout.js';
import {JobWorker} from '../src/jobs/worker.js';

const modulePath=String(process.env.CODINGVIBES_WORKER_HANDLER_MODULE||'').trim();
if(!modulePath){console.error('Set CODINGVIBES_WORKER_HANDLER_MODULE to an ES module exporting handlers or registerHandlers.');process.exit(2);}

const services=await createScaleOutServices();
try{
 const resolved=path.isAbsolute(modulePath)?modulePath:path.resolve(process.cwd(),modulePath);
 const module=await import(pathToFileURL(resolved).href);
 const handlers=module.handlers||{};
 if(typeof module.registerHandlers==='function')module.registerHandlers(handlers);
 const worker=new JobWorker({queue:services.queue,handlers,concurrency:Number(process.env.CODINGVIBES_WORKER_CONCURRENCY||1)});
 const stop=()=>worker.stop();
 process.once('SIGINT',stop);process.once('SIGTERM',stop);
 await worker.start();
}finally{try{await services.queue?.close();}catch{}try{await services.database?.close();}catch{}}