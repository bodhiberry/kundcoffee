import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // --- CORS check for public API ---
  if (path.startsWith("/api/public/")) {
    const origin = req.headers.get("origin") || "";
    // Allow https://app.kundcoffee.com (handling trailing slash normalization if needed)
    const isAllowed = origin === "https://app.kundcoffee.com" || origin === "https://app.kundcoffee.com/";
    const allowedOrigin = isAllowed ? origin : "https://app.kundcoffee.com";
    
    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": allowedOrigin,
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const response = await NextResponse.next();
    response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    return response;
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const host = req.headers.get("host") || "";
  const isAdminSubdomain = host.startsWith("admin.");

  // Determine protocols and redirect hosts dynamically (works for production & localhost)
  const isDev = host.includes("localhost") || host.includes("127.0.0.1");
  const protocol = isDev ? "http:" : "https:";
  const baseHost = host.replace(/^(admin\.|cafe\.)/, "");
  
  const cafeDashboardUrl = `${protocol}//cafe.${baseHost}/dashboard`;
  const adminDashboardUrl = `${protocol}//admin.${baseHost}/dashboard`;

  // Route Definitions
  const isAuthPage = path === "/login" || path === "/signup";
  const isVerifyPage = path === "/verify-email";
  const isSetupPage = path === "/setup-store";
  const isDashboardPage = path.startsWith("/dashboard");
  const isHomePage = path === "/";
  const isBlockedPage = path === "/blocked";

  // --- 1. SUPER ADMIN / PLATFORM SUBDOMAIN GATE ---
  if (isAdminSubdomain) {
    // Signup is disabled for platform admins
    if (path === "/signup") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (!token) {
      if (isDashboardPage || isHomePage) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      // Serve files from /platform path internally
      const url = req.nextUrl.clone();
      url.pathname = `/platform${path}`;
      return NextResponse.rewrite(url);
    }

    // If logged in as normal tenant user, redirect to cafe portal
    if (!token.isPlatformUser) {
      return NextResponse.redirect(new URL(cafeDashboardUrl, req.url));
    }

    // If logged in as super admin, prevent access to login/signup/home
    if (isAuthPage || isHomePage) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Serve files from /platform path internally
    const url = req.nextUrl.clone();
    url.pathname = `/platform${path}`;
    return NextResponse.rewrite(url);
  }

  // --- 2. TENANT / STORE SUBDOMAIN GATE ---
  // If logged in as super admin, redirect to admin portal
  if (token && token.isPlatformUser) {
    return NextResponse.redirect(new URL(adminDashboardUrl, req.url));
  }

  // Check store status (suspended or expired)
  const isStoreInactive = token && (token.storeSuspended || token.storeStatus === "SUSPENDED" || token.storeStatus === "EXPIRED");

  // Standard tenant authentication checks
  if (!token) {
    if (isDashboardPage || isVerifyPage || isSetupPage || isHomePage || isBlockedPage) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  // If store is inactive (suspended or expired), enforce /blocked page redirect
  if (isStoreInactive) {
    if (!isBlockedPage) {
      return NextResponse.redirect(new URL("/blocked", req.url));
    }
    return NextResponse.next();
  }

  // If store is healthy, they shouldn't access the blocked page
  if (isBlockedPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isAuthPage || isHomePage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Onboarding checks for tenant users
  if (!token.emailVerified && !isVerifyPage) {
    const url = new URL("/verify-email", req.url);
    if (token.email) url.searchParams.set("email", token.email as string);
    return NextResponse.redirect(url);
  }

  if (token.emailVerified && !token.isSetupComplete && !isSetupPage) {
    return NextResponse.redirect(new URL("/setup-store", req.url));
  }

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
    "/blocked",
    "/api/public/:path*",
  ],
};