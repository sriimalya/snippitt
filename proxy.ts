import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request , secret: process.env.NEXTAUTH_SECRET });

  // Log the emailVerified property from the token
  console.log("Token emailVerified:", token?.emailVerified);

  // Public routes
  const publicRoutes = ["/", "/auth/sign-in", "/auth/sign-up", "/auth/verify-email","/contact","/about" ,"/privacy-policy", "/auth/forgot-password"];
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + "/")
  );

  // 1. Redirect logged-in users away from auth pages
  if (token && (pathname.startsWith("/auth/sign-in") || pathname.startsWith("/auth/sign-up"))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 2. Redirect unauthenticated users to sign-in
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  // 3. Handle email verification status
  if (token) {
    // Force token refresh by adding a timestamp query parameter
    //const shouldRefreshToken = request.nextUrl.searchParams.get('refreshToken');
    
    // If email is verified, redirect away from verification page
    if (token.emailVerified && pathname.startsWith("/auth/verify-email")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    
    // If email is NOT verified, redirect to verification page (except for allowed routes)
    if (!token.emailVerified && 
        !isPublicRoute && 
        !pathname.startsWith("/api") && 
        pathname !== "/") {
      const verifyUrl = new URL("/auth/verify-email", request.url);
      verifyUrl.searchParams.set('email', token.email || '');
      return NextResponse.redirect(verifyUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth (NextAuth.js endpoints)
     * - public assets (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/auth|public).*)",
  ],
};