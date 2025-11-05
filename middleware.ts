import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname;

  // Redirect /login and /signup to /auth
  if (path === '/login' || path === '/signup') {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // Continue with the request if no redirects needed
  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/signup'],
};