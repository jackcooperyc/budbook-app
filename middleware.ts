import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@lib/auth/session';

const PUBLIC_PATHS = ['/pacs/sign-in', '/api/auth'];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const secret = process.env.PACSMT_AUTH_SECRET?.trim();
  if (!secret) return NextResponse.next();

  const { pathname } = request.nextUrl;
  const needsAuth =
    pathname.startsWith('/pacs') || pathname.startsWith('/api/internal');

  if (!needsAuth || isPublic(pathname)) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ message: 'Sign in required' }, { status: 401 });
    }
    const signIn = new URL('/pacs/sign-in', request.url);
    signIn.searchParams.set('next', pathname);
    return NextResponse.redirect(signIn);
  }

  const session = await verifySessionToken(token);
  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ message: 'Session expired' }, { status: 401 });
    }
    const signIn = new URL('/pacs/sign-in', request.url);
    return NextResponse.redirect(signIn);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/pacs/:path*', '/api/internal/:path*'],
};
