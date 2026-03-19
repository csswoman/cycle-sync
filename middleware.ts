import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/check-email') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/auth/callback');

  const isPWARoute =
    pathname.startsWith('/serwist') ||
    pathname.startsWith('/~offline') ||
    pathname === '/manifest.json';

  if (isPWARoute) return NextResponse.next();

  const isAppRoute =
    !isAuthRoute &&
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/favicon') &&
    pathname !== '/';

  // Supabase stores the session in a cookie named sb-*-auth-token
  const hasSession = request.cookies.getAll().some((c) => c.name.includes('-auth-token'));

  if (isAppRoute && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  const skipRedirectWhenAuthenticated =
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/auth/callback');

  if (isAuthRoute && hasSession && !skipRedirectWhenAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|sw\\.js|swe-worker|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
