import {readSessionCookie,verifySessionToken} from '../security/auth.js';

export function superAdminEmails(){
  return String(process.env.CODINGVIBES_SUPERADMIN_EMAILS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
}
export function isSuperAdmin(email){const e=String(email||'').trim().toLowerCase();return Boolean(e)&&superAdminEmails().includes(e);}
export function actorFromRequest(req,store){
  if(req?._cvAdminEmail)return String(req._cvAdminEmail).trim().toLowerCase();
  const token=readSessionCookie(req||{headers:{}});if(!token)return null;
  const id=verifySessionToken(token);if(!id)return null;
  const session=store.getAuthSession(id);return session?.email?String(session.email).trim().toLowerCase():null;
}
export function requireSuperAdmin(req,store){
  const email=actorFromRequest(req,store);
  if(!isSuperAdmin(email))throw Object.assign(new Error('super_admin_required'),{status:403});
  const user=store.getUserByEmail(email);if(!user)throw Object.assign(new Error('super_admin_user_not_found'),{status:403});
  return user.id;
}
export function opsOverview(store){return store.systemOverview();}
