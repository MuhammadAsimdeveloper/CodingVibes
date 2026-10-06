import {BackendRuntime} from '../src/backend/runtime.js';

const backend=new BackendRuntime();
try{
  await backend.init();
  const status=await backend.status();
  console.log(JSON.stringify(status,null,2));
  if(!status.ok){console.error('Build Vibe backend preflight failed.');process.exitCode=2;}
  else console.log('Build Vibe backend preflight: PASS');
}catch(error){
  console.error(JSON.stringify({ok:false,error:String(error?.message||error)},null,2));
  process.exitCode=2;
}finally{
  try{await backend.close();}catch{}
}
