# syntax=docker/dockerfile:1.7
# ACME Salary UI: Next.js standalone server. Only the traced runtime files ship.

# ── dependencies ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Same supply-chain policy as CI: frozen lockfile, release-age cutoff, script allow-list.
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

# ── build ────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# /api is proxied to this address; Next bakes rewrites in at build time.
ARG BACKEND_URL=http://backend:8080
ENV BACKEND_URL=$BACKEND_URL \
    NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ── runtime ──────────────────────────────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# The standalone server is plain `node server.js`: no package manager is needed at runtime, so
# npm, npx and corepack are removed (they carried every CVE the image scan found, and an
# attacker who gets a shell can no longer use them to pull in tools).
# Take Alpine security patches as soon as they ship, not when the base image is next rebuilt.
RUN apk upgrade --no-cache \
 && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
 && addgroup -S app && adduser -S -G app -H app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
USER app
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/login > /dev/null || exit 1
CMD ["node", "server.js"]
