import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "auth";

// Public paths — never redirect these to /login
const PUBLIC_PATHS = ["/login", "/api/login", "/api/logout"];

async function computeToken(secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("auth"));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths through
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) return NextResponse.next(); // misconfigured — fail open in dev

  const cookie = req.cookies.get(COOKIE_NAME)?.value;

  if (cookie) {
    const expected = await computeToken(secret);
    if (cookie === expected) return NextResponse.next();
  }

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - /uploads      (served uploads)
     */
    "/((?!_next/static|_next/image|favicon.ico|uploads/).*)",
  ],
};
