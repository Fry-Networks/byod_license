# syntax=docker/dockerfile:1.7
FROM 1password/op:2@sha256:57d7d6a2bb2b74b2cf8111f6afb2973c74772198f82ea30359a53faae9fff5b1 AS op

FROM node:22-slim AS builder

WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# Build tools are required for native modules like better-sqlite3.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Explicit npm pin; corepack does not reliably activate npm on this base image.
RUN npm install -g npm@11.8.0

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps --include=dev

COPY . .
RUN npm run build
RUN npm prune --omit=dev && npm cache clean --force

FROM node:22-slim AS runner

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3001

WORKDIR /app

# Keep runtime dependencies minimal and use dumb-init for signal handling.
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates dumb-init gosu \
  && rm -rf /var/lib/apt/lists/*

# Copy op from the official 1Password CLI image (no ad-hoc downloads).
COPY --from=op /usr/local/bin/op /usr/local/bin/op

# Create a fixed non-root runtime user.
RUN groupadd --system --gid 1001 appuser \
  && useradd --system --uid 1001 --gid 1001 --create-home --home-dir /home/appuser appuser

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/config/HTMLtemplate.html ./config/HTMLtemplate.html
COPY --from=builder /app/node_modules ./node_modules
COPY package.json package-lock.json ./

RUN mkdir -p /app/.next/cache /app/config \
  && chown -R appuser:appuser /app

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod 0755 /usr/local/bin/docker-entrypoint.sh

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3001/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1));"

ENTRYPOINT ["dumb-init", "--", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "start"]
