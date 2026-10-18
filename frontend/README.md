# ACME Salary — Angular UI

Angular 22 + Angular Material front end for the salary API. See the repository README for the
product, and `CLAUDE.md` for conventions.

```bash
pnpm install
pnpm start      # http://localhost:4200, /api proxied to the backend on :8080
pnpm test       # Vitest
pnpm lint
pnpm build
```

Requires Node 24 LTS. Production: `Dockerfile` builds static files served by unprivileged nginx,
which also proxies `/api` and sets a per-request CSP nonce.
