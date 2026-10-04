import {scaleOutConfig,createScaleOutServices} from '../src/platform/scaleout.js';

const config=scaleOutConfig();
console.log(JSON.stringify({config},null,2));
if(!config.ready){console.error('Scale-out configuration is incomplete.');process.exit(2);}

let services;
try{
 services=await createScaleOutServices();
 const checks={config:true,objectStorage:await services.objectStore.healthcheck(),queue:await services.queue.healthcheck()};
 if(services.database)checks.database=await services.database.healthcheck();
 console.log(JSON.stringify({ok:Object.values(checks).every(Boolean),checks},null,2));
 if(!Object.values(checks).every(Boolean))process.exitCode=2;
}catch(error){console.error(JSON.stringify({ok:false,error:String(error.message||error)},null,2));process.exitCode=2;}
finally{
 try{if(services?.queue)await services.queue.close();}catch{}
 try{if(services?.database)await services.database.close();}catch{}
}