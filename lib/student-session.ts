import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export const STUDENT_COOKIE = 'alite_student';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface StudentSession {
  id: number;
  name: string;
  email: string;
}

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error('SESSION_SECRET is not set');
  return new TextEncoder().encode(s);
}

export async function createStudentSession(student: StudentSession): Promise<void> {
  const token = await new SignJWT({ student })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + MAX_AGE)
    .sign(secret());
  const store = await cookies();
  store.set(STUDENT_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE,
    path: '/'
  });
}

export async function destroyStudentSession(): Promise<void> {
  const store = await cookies();
  store.delete(STUDENT_COOKIE);
}

export async function getStudent(): Promise<StudentSession | null> {
  try {
    const store = await cookies();
    const token = store.get(STUDENT_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret());
    const p = payload as unknown as { student?: StudentSession };
    return p.student ?? null;
  } catch {
    return null;
  }
}
