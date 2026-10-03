import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export const WRITER_COOKIE = 'alite_writer';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface WriterSession {
  id: number;
  name: string;
  email: string;
}

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error('SESSION_SECRET is not set');
  return new TextEncoder().encode(s);
}

export async function createWriterSession(writer: WriterSession): Promise<void> {
  const token = await new SignJWT({ writer })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + MAX_AGE)
    .sign(secret());
  const store = await cookies();
  store.set(WRITER_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE,
    path: '/'
  });
}

export async function destroyWriterSession(): Promise<void> {
  const store = await cookies();
  store.delete(WRITER_COOKIE);
}

export async function getWriter(): Promise<WriterSession | null> {
  try {
    const store = await cookies();
    const token = store.get(WRITER_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret());
    const p = payload as unknown as { writer?: WriterSession };
    return p.writer ?? null;
  } catch {
    return null;
  }
}