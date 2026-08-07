import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import type { AdminUser } from './types';

export const SESSION_COOKIE = 'alite_session';
const MAX_AGE = 7 * 24 * 60 * 60; // 7 days

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET || 'alite-dev-secret-change-me';
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

export async function requireAdmin(): Promise<AdminUser | null> {
  const user = await readSession();
  if (!user) return null;
  return user;
}

/** For middleware (edge-safe verification) */
export async function verifySessionToken(token: string): Promise<AdminUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    const p = payload as unknown as SessionPayload;
    return p.user ?? null;
  } catch {
    return null;
  }
}

export function getSessionCookie(req: NextRequest): string | undefined {
  return req.cookies.get(SESSION_COOKIE)?.value;
}
