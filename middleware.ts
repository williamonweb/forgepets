import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('forgepets_session')?.value;
  const path = request.nextUrl.pathname;
  if ((path.startsWith('/app') || path.startsWith('/master')) && !token) return NextResponse.redirect(new URL('/login', request.url));
  return NextResponse.next();
}

export const config = { matcher: ['/app/:path*', '/master/:path*'] };
