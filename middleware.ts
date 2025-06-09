import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Allow access to login, logout, API routes, and static files
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/logout') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Get the token
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET || "hbsidufgkiasubd" 
  });

  // If no token and trying to access protected routes, redirect to login
  if (!token) {
    // Allow access to root page for login form
    if (pathname === '/') {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/', req.url));
  }

  // If user is authenticated and it's their first login
  if (token && token.isFirstLogin) {
    // Allow access to change-password page
    if (pathname === '/change-password') {
      return NextResponse.next();
    }
    
    // Redirect to change password page for any other protected route
    return NextResponse.redirect(new URL('/change-password', req.url));
  }

  // If user is authenticated and not first login, redirect from root to dashboard
  if (token && !token.isFirstLogin && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
