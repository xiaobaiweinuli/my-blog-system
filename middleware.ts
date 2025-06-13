import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Protect /admin routes
  if (pathname.startsWith('/admin')) {
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = '/api/auth/signin';
      url.searchParams.set('callbackUrl', req.nextUrl.href);
      return NextResponse.redirect(url);
    }

    // @ts-ignore
    const userRole = token.user?.role;

    if (userRole !== 'admin' && userRole !== 'collaborator') {
      const url = req.nextUrl.clone();
      url.pathname = '/unauthorized';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};