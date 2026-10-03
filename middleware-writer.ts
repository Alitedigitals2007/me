import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';

const SESSION_COOKIE = 'alite_writer';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret(): Uint8Array | null {
  const s = process.env.SESSION_SECRET;
  if (!s) return null;
  return new TextEncoder().encode(s);
}

interface SessionPayload {
  writer?: { id: number; email: string; name: string };
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

export async function writerMiddleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const payload = await verifyToken(req.cookies.get(SESSION_COOKIE)?.value);
  const hasSession = !!payload?.writer;

  if (pathname.startsWith('/writer/login') || pathname.startsWith('/writer/signup')) {
    if (hasSession) return NextResponse.redirect(new URL('/writer/dashboard', req.url));
    return NextResponse.next();
  }

  if (pathname.startsWith('/writer')) {
    if (!hasSession) {
      const login = new URL('/writer/login', req.url);
      login.searchParams.set('next', pathname);
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const writerConfig = {
  matcher: ['/writer/:path*', '/writer/login', '/writer/signup']
};