# syntax=docker/dockerfile:1.7
# ACME Salary UI: the Angular build served by unprivileged nginx, which also proxies /api.

# ── build ────────────────────────────────────────────────────────────────────
FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Same supply-chain policy as CI: frozen lockfile, release-age cutoff, script allow-list.
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ── runtime ──────────────────────────────────────────────────────────────────
# Static files and nginx only: no Node, no package manager, non-root (uid 101), port 3000.
FROM nginxinc/nginx-unprivileged:1.30.6-alpine
USER root
# Take Alpine security patches as soon as they ship, not when the base image is next rebuilt.
RUN apk upgrade --no-cache
USER 101
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist/salary-frontend/browser /usr/share/nginx/html
ENV BACKEND_URL=http://backend:8080
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/healthz > /dev/null || exit 1
