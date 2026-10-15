import { NextResponse, type NextRequest } from "next/server";
import { buildCsp } from "@shared/security/csp";

const PUBLIC_PATHS = new Set(["/login"]);

/**
 * Runs before every page — not /api (proxied straight to the backend) and not static files,
 * which must load on the sign-in page before any session exists.
 * 1. A fresh CSP nonce per request; Next.js applies it to its own scripts.
 * 2. No session cookie → sign-in page. This is a UX shortcut only: the API checks the session on
 *    every call, so a forged cookie gets an empty shell and 401s, never data.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!PUBLIC_PATHS.has(pathname) && !request.cookies.has("SALARY_SESSION")) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(login);
  }

  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce, process.env.NODE_ENV === "development");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|.*\\.[a-z0-9]+$).*)"]
};
