import crypto from 'node:crypto';

function canonical(value){return JSON.stringify({
  version:String(value?.version||''),
  commitSha:String(value?.commitSha||''),
  targetId:String(value?.targetId||''),
  artifactFingerprint:String(value?.artifactFingerprint||''),
  verification:value?.verification&&typeof value.verification==='object'?value.verification:{}
});}
export function createDeploymentAttestation(input={}, {secret=process.env.CODINGVIBES_ATTESTATION_SECRET||''}={}){
  const payload={...input,generatedAt:new Date().toISOString()};
  const key=String(secret||'').trim();
  const signature=key?crypto.createHmac('sha256',key).update(canonical(payload)).digest('hex'):null;
  return{schema:'build-vibe.deployment-attestation.v1',status:key?'SIGNED':'UNSIGNED',...payload,signature};
}
export function verifyDeploymentAttestation(attestation,{secret=process.env.CODINGVIBES_ATTESTATION_SECRET||''}={}){
  if(!attestation||attestation.status!=='SIGNED'||!secret||!attestation.signature)return false;
  const expected=crypto.createHmac('sha256',String(secret)).update(canonical(attestation)).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(String(attestation.signature)));
}
