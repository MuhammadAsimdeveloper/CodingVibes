import {randomBytes, scrypt as scryptCb, timingSafeEqual, createHmac} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt = promisify(scryptCb);
const COOKIE = 'cv_session';

function secret() {
  const value = process.env.CODINGVIBES_SESSION_SECRET;
  if (!value && process.env.NODE_ENV === 'production') throw new Error('CODINGVIBES_SESSION_SECRET is required in production');
  return value || 'development-only-change-me';
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scrypt(String(password), salt, 32);
  return `${salt}:${Buffer.from(derived).toString('hex')}`;
}

export async function verifyPassword(password, encoded) {
  const [salt, hex] = String(encoded).split(':');
  if (!salt || !hex) return false;
  const actual = Buffer.from(await scrypt(String(password), salt, 32));
  const expected = Buffer.from(hex, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function signSession(id) {
  const sig = createHmac('sha256', secret()).update(id).digest('hex');
  return `${id}.${sig}`;
}

export function verifySessionToken(token) {
  const [id, sig] = String(token ?? '').split('.');
  if (!id || !sig) return null;
  const expected = createHmac('sha256', secret()).update(id).digest('hex');
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return id;
}

export function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secure}`);
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

export function readSessionCookie(req) {
  const header = req.headers.cookie || '';
  const item = header.split(';').map(x => x.trim()).find(x => x.startsWith(`${COOKIE}=`));
  return item ? decodeURIComponent(item.slice(COOKIE.length + 1)) : null;
}
