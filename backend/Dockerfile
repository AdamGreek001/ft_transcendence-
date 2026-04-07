# ── Stage 1: Install all dependencies ──────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

USER root
RUN mkdir -p /app/uploads/avatars && chmod -R 777 /app/uploads

COPY package.json package-lock.json* ./
RUN npm ci && \
    npm cache clean --force && \
    rm -rf /tmp/*

# ── Stage 2: Build the application ────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ── Stage 3: Production runner ─────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nestjs && \
    adduser --system --uid 1001 nestjs && \
    apk add --no-cache wget && \
    rm -rf /var/cache/apk/*

COPY --from=builder /app/dist ./dist
COPY package.json package-lock.json* ./
COPY docker-entrypoint.sh ./
RUN npm ci --omit=dev && \
    npm cache clean --force && \
    rm -rf /tmp/* && \
    chmod +x docker-entrypoint.sh && \
    mkdir -p /app/uploads && \
    chown -R nestjs:nestjs /app/uploads

USER nestjs
EXPOSE 3001
ENTRYPOINT ["./docker-entrypoint.sh"]
