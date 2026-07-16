import { NextResponse } from "next/server";

/**
 * Standard CORS headers for public API routes.
 * Used by the POS frontend and other external clients.
 */
export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS, POST, PUT, DELETE, PATCH",
  "Access-Control-Allow-Headers":
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
  "Access-Control-Max-Age": "86400",
};

/**
 * Returns a NextResponse with CORS headers applied.
 */
export function corsResponse(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, {
    status: init?.status || 200,
    headers: corsHeaders,
  });
}

/**
 * Returns a 200 preflight response for OPTIONS requests.
 */
export function corsPreflightResponse() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}
