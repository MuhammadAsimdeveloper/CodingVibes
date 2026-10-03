import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';

const PREFIX='cv_live_';

export function createApiToken(){
  const token=PREFIX+randomBytes(32).toString('base64url');
  return {token,hash:hashApiToken(token),prefix:token.slice(0,PREFIX.length+8)};
}
export function hashApiToken(token){
  return createHash('sha256').update(String(token||''),'utf8').digest('hex');
}
export function verifyApiToken(token,expectedHash){
  const a=Buffer.from(hashApiToken(token),'hex');
  const b=Buffer.from(String(expectedHash||''),'hex');
  return a.length===b.length&&a.length>0&&timingSafeEqual(a,b);
}
export function isApiToken(token){return String(token||'').startsWith(PREFIX)&&String(token).length>20;}
