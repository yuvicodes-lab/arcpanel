import crypto from 'crypto';
import { cookies } from 'next/headers';

const secret = () => process.env.SESSION_SECRET || 'development-secret';

function sign(value) {
  return crypto.createHmac('sha256', secret()).update(value).digest('hex');
}

export async function setSession(user) {
  const value = Buffer.from(JSON.stringify(user)).toString('base64url');
  const signature = sign(value);
  const cookieStore = await cookies();

  cookieStore.set('yuvi_session', `${value}.${signature}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('yuvi_session')?.value;

  if (!sessionCookie) {
    return null;
  }

  const [value, signature] = sessionCookie.split('.');
  if (!value || !signature) {
    return null;
  }

  const expectedSignature = sign(value);

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const jsonString = Buffer.from(value, 'base64url').toString('utf-8');
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete('yuvi_session');
}

export function csrf() {
  return crypto.randomBytes(24).toString('hex');
}

export function randomKey(n = 12) {
  return crypto
    .randomBytes(n)
    .toString('hex')
    .toUpperCase()
    .slice(0, n);
}
