# ─────────────────────────────────────────────────────────────────
# Frontend Dockerfile — Next.js 14 (App Router)
# ─────────────────────────────────────────────────────────────────
#
# Multi-stage build:
# Stage 1 (deps):    Install all node_modules
# Stage 2 (builder): Build the Next.js application
# Stage 3 (runner):  Minimal production image with only build output
#
# Why multi-stage?
# - node_modules can be 500MB+. The final image only needs the .next/ output.
# - Standalone output mode (next.config.ts) bundles only used dependencies.
# ─────────────────────────────────────────────────────────────────

# ── Stage 1: Install dependencies ───────────────────────────────
FROM node:20-alpine AS deps

# libc6-compat for some native Node modules
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

# ── Stage 2: Build the Next.js app ──────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_ variables are baked into the build at build time
# The backend URL must be known during build — passed as a build arg
ARG NEXT_PUBLIC_API_URL=http://backend:8000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── Stage 3: Production runner ───────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
    && adduser  --system --uid 1001 nextjs

# Copy the standalone output — this is a self-contained server
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Next.js standalone output includes a server.js entry point
CMD ["node", "server.js"]
