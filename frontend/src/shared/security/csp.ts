/**
 * Content-Security-Policy for pages. Scripts run only if they carry this request's nonce
 * ('strict-dynamic' extends trust to scripts those load), so an injected <script> does nothing.
 * Inline styles are allowed because the chart library sets style attributes.
 */
export function buildCsp(nonce: string, isDev: boolean) {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self'${isDev ? " ws:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ];
  if (!isDev) {
    directives.push("upgrade-insecure-requests");
  }
  return directives.join("; ");
}
