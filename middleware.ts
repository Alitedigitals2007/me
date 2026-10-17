import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';

const ADMIN_COOKIE = 'alite_session';
const WRITER_COOKIE = 'alite_writer';
const STUDENT_COOKIE = 'alite_student';
const ADMIN_MAX_AGE = 30 * 60; // 30 minutes
const WRITER_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret(): Uint8Array | null {
  const s = process.env.SESSION_SECRET;
  if (!s) return null;
  return new TextEncoder().encode(s);
}

interface AdminPayload {
  user?: { id: number; email: string; username: string; role: string };
  exp?: number;
  iat?: number;
}

interface WriterPayload {
  writer?: { id: number; email: string; name: string };
  exp?: number;
  iat?: number;
}

interface StudentPayload {
  student?: { id: number; email: string; name: string };
  exp?: number;
  iat?: number;
}

async function verifyToken<T>(token: string | undefined): Promise<T | null> {
  const key = secret();
  if (!key || !token) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    return payload as T;
  } catch {
    return null;
  }
}

async function refreshAdminSession(payload: AdminPayload): Promise<string | null> {
  if (!payload.user) return null;
  const key = secret();
  if (!key) return null;
  return new SignJWT({ user: payload.user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ADMIN_MAX_AGE)
    .sign(key);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const [adminPayload, writerPayload, studentPayload] = await Promise.all([
    verifyToken<AdminPayload>(req.cookies.get(ADMIN_COOKIE)?.value),
    verifyToken<WriterPayload>(req.cookies.get(WRITER_COOKIE)?.value),
    verifyToken<StudentPayload>(req.cookies.get(STUDENT_COOKIE)?.value)
  ]);
  const hasAdminSession = !!adminPayload?.user;
  const hasWriterSession = !!writerPayload?.writer;
  const hasStudentSession = !!studentPayload?.student;

  // Unified auth page: signed-in visitors go straight to their dashboard.
  if (pathname === '/login') {
    if (hasAdminSession) return NextResponse.redirect(new URL('/admin', req.url));
    if (hasStudentSession) return NextResponse.redirect(new URL('/dashboard', req.url));
    if (hasWriterSession) return NextResponse.redirect(new URL('/writer/dashboard', req.url));
    return NextResponse.next();
  }

  if (pathname === '/admin/login') {
    return NextResponse.redirect(new URL(hasAdminSession ? '/admin' : '/login', req.url));
  }

  // Admin routes
  if (pathname.startsWith('/admin')) {
    if (!hasAdminSession) {
      const login = new URL('/login', req.url);
      login.searchParams.set('next', pathname);
      return NextResponse.redirect(login);
    }

    const res = NextResponse.next();
    if (adminPayload?.exp && adminPayload.user) {
      const elapsed = Math.floor(Date.now() / 1000) - (adminPayload.iat ?? 0);
      if (elapsed > ADMIN_MAX_AGE / 2) {
        const token = await refreshAdminSession(adminPayload);
        if (token) {
          res.cookies.set(ADMIN_COOKIE, token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: ADMIN_MAX_AGE,
            path: '/'
          });
        }
      }
    }
    return res;
  }

  // Legacy auth URLs -> unified /login page
  if (pathname === '/writer/login' || pathname === '/writer/signup') {
    if (hasWriterSession) return NextResponse.redirect(new URL('/writer/dashboard', req.url));
    const login = new URL('/login', req.url);
    login.searchParams.set('role', 'writer');
    login.searchParams.set('mode', pathname === '/writer/signup' ? 'signup' : 'login');
    if (req.nextUrl.searchParams.get('next')) {
      login.searchParams.set('next', req.nextUrl.searchParams.get('next')!);
    }
    return NextResponse.redirect(login);
  }

  if (pathname === '/academy/login' || pathname === '/academy/signup') {
    if (hasStudentSession) return NextResponse.redirect(new URL('/dashboard', req.url));
    const login = new URL('/login', req.url);
    login.searchParams.set('role', 'student');
    login.searchParams.set('mode', pathname === '/academy/signup' ? 'signup' : 'login');
    if (req.nextUrl.searchParams.get('next')) {
      login.searchParams.set('next', req.nextUrl.searchParams.get('next')!);
    }
    return NextResponse.redirect(login);
  }

  // Writer routes
  if (pathname.startsWith('/writer')) {
    if (!hasWriterSession) {
      const login = new URL('/writer/login', req.url);
      login.searchParams.set('next', pathname);
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/login',
    '/writer/:path*',
    '/writer/login',
    '/writer/signup',
    '/academy/login',
    '/academy/signup'
  ]
};
