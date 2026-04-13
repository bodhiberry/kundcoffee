import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const path = req.nextUrl.pathname;

  // Route Definitions
  const isAuthPage = path === "/login" || path === "/signup";
  const isVerifyPage = path === "/verify-email";
  const isSetupPage = path === "/setup-store";
  const isDashboardPage = path.startsWith("/dashboard");
  const isHomePage = path === "/";

  // 1. If user is NOT logged in
  if (!token) {
    // PROTECT the Dashboard, onboarding, and Home pages
    if (isDashboardPage || isVerifyPage || isSetupPage || isHomePage) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    // ALLOW Login and Signup
    return NextResponse.next();
  }

  // 2. If user IS logged in, prevent them from seeing Login/Signup/Home
  if (isAuthPage || isHomePage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 3. Email Verification Check
  // Only enforce for self-registered users (emailVerified is null)
  if (!token.emailVerified && !isVerifyPage) {
    const url = new URL("/verify-email", req.url);
    if (token.email) url.searchParams.set("email", token.email as string);
    return NextResponse.redirect(url);
  }

  // 4. Setup Check
  if (token.emailVerified && !token.isSetupComplete && !isSetupPage) {
    return NextResponse.redirect(new URL("/setup-store", req.url));
  }

  // 5. Cleanup: If they are finished with onboarding, don't let them go back
  if (token.emailVerified && isVerifyPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  
  if (token.isSetupComplete && isSetupPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/verify-email",
    "/setup-store",
    "/login",
    "/signup",
  ],
};