import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'nivaari_session';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  // Canonical auth route.
  if (path === '/login' || path === '/signup') {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // Authenticated users should not stay on auth page.
  if (path === '/auth' && hasSession) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Unauthenticated users must login before seeing home/dashboard.
  if ((path === '/' || path.startsWith('/citizen-dashboard')) && !hasSession) {
    const authUrl = new URL('/auth', request.url);
    authUrl.searchParams.set('from', path);
    return NextResponse.redirect(authUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/auth', '/login', '/signup', '/citizen-dashboard/:path*'],
};