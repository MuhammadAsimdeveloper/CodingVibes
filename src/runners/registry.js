import crypto from 'node:crypto';

function token(){return process.env.CODINGVIBES_RUNNER_CONTROL_TOKEN||'';}
export function runnerControlConfigured(){return Boolean(token());}
export function validRunnerToken(value){const expected=token();const actual=Buffer.from(String(value||''));const want=Buffer.from(expected);return Boolean(expected&&actual.length===want.length&&crypto.timingSafeEqual(actual,want));}
export function requireRunnerToken(value){if(!validRunnerToken(value)){const e=new Error('runner control token required');e.status=401;throw e;}return true;}
export function normalizeRunner(payload={}){
  const id=String(payload.id||'').trim(); const name=String(payload.name||id).trim(); const capability=String(payload.capability||'').trim();
  if(!/^[A-Za-z0-9._-]{1,80}$/.test(id)) throw new Error('invalid runner id');
  if(!/^[A-Za-z0-9._ -]{1,80}$/.test(name)) throw new Error('invalid runner name');
  if(!/^[a-z][a-z0-9-]{1,40}$/.test(capability)) throw new Error('invalid runner capability');
  const labels=Array.isArray(payload.labels)?payload.labels.filter(x=>/^[A-Za-z0-9._:-]{1,60}$/.test(String(x))).slice(0,20).map(String):[];
  const metadata=payload.metadata&&typeof payload.metadata==='object'&&!Array.isArray(payload.metadata)?payload.metadata:{};
  return {id,name,capability,labels,metadata,status:['ready','draining','offline'].includes(payload.status)?payload.status:'ready'};
}
