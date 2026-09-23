import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';

const SESSION_COOKIE = 'alite_session';
const MAX_AGE = 30 * 60; // 30 minutes

function secret(): Uint8Array | null {
  const s = process.env.SESSION_SECRET;
  if (!s) return null;
  return new TextEncoder().encode(s);
}

interface SessionPayload {
  user?: { id: number; email: string; username: string; role: string };
  exp?: number;
  iat?: number;
}

async function verifyToken(token: string | undefined): Promise<SessionPayload | null> {
  const key = secret();
  if (!key || !token) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

async function refreshSession(payload: SessionPayload): Promise<string | null> {
  if (!payload.user) return null;
  const key = secret();
  if (!key) return null;
  return new SignJWT({ user: payload.user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + MAX_AGE)
    .sign(key);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const payload = await verifyToken(req.cookies.get(SESSION_COOKIE)?.value);
  const hasSession = !!payload;

  if (pathname.startsWith('/login')) {
    if (hasSession) return NextResponse.redirect(new URL('/admin', req.url));
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin')) {
    if (!hasSession) {
      const login = new URL('/login', req.url);
      login.searchParams.set('next', pathname);
      return NextResponse.redirect(login);
    }

    // Sliding refresh: re-issue the cookie when more than half its lifetime has elapsed
    const res = NextResponse.next();
    if (payload.exp && payload.user) {
      const elapsed = Math.floor(Date.now() / 1000) - (payload.iat ?? 0);
      if (elapsed > MAX_AGE / 2) {
        const token = await refreshSession(payload);
        if (token) {
          res.cookies.set(SESSION_COOKIE, token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: MAX_AGE,
            path: '/'
          });
        }
      }
    }
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login']
};
