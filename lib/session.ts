import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { AdminUser } from './types';

export const SESSION_COOKIE = 'alite_session';
const MAX_AGE = 30 * 60; // 30 minutes

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error('SESSION_SECRET is not set');
  return new TextEncoder().encode(s);
}

interface SessionPayload {
  user: AdminUser;
  exp?: number;
}

export async function createSession(user: AdminUser): Promise<void> {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + MAX_AGE)
    .sign(secret());
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE,
    path: '/'
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function readSession(): Promise<AdminUser | null> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret());
    const p = payload as unknown as SessionPayload;
    return p.user ?? null;
  } catch {
    return null;
  }
}
