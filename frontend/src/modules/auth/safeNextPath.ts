/**
 * Where to go after sign-in. Only same-site paths are honoured; anything else (absolute URLs,
 * protocol-relative "//evil.example", backslash tricks) falls back to the home page, so the
 * login page cannot be used as an open redirect in a phishing link.
 */
export function safeNextPath(next: string | null | undefined, fallback = "/insights") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return fallback;
  }
  return next;
}
