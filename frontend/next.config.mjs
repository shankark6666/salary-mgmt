/**
 * The UI and API share one origin: the browser only ever talks to this Next.js server, which
 * forwards /api/* to the backend. Session and CSRF cookies therefore stay first-party and
 * SameSite=Strict, and the backend needs no CORS policy at all (ADR-0006).
 */
const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8080";

/** Page-level headers. The CSP is set per request in middleware, because it carries a nonce. */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  }
};

export default nextConfig;
