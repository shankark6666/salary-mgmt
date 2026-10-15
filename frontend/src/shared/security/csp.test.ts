import { buildCsp } from "./csp";

describe("buildCsp", () => {
  const production = buildCsp("abc123", false);

  it("only runs scripts carrying the request nonce", () => {
    expect(production).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(production).not.toContain("unsafe-eval");
    expect(production).not.toMatch(/script-src[^;]*unsafe-inline/);
  });

  it("forbids framing, plugins and foreign form targets", () => {
    expect(production).toContain("frame-ancestors 'none'");
    expect(production).toContain("object-src 'none'");
    expect(production).toContain("form-action 'self'");
  });

  it("allows eval only in development, for hot reload", () => {
    expect(buildCsp("n", true)).toContain("'unsafe-eval'");
  });
});
