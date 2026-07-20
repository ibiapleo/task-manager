# Multi-stage build for the Task Manager API.
# Build context is the monorepo root so Yarn workspaces resolve correctly.

# ---------- Builder ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Root workspace manifests
COPY package.json yarn.lock* ./
# API workspace manifest (needed before install for caching)
COPY apps/api/package.json ./apps/api/package.json

RUN yarn install --frozen-lockfile || yarn install

# Copy source and build
COPY apps/api ./apps/api
RUN yarn workspace api prisma:generate \
  && yarn workspace api build

# ---------- Runtime ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json yarn.lock* ./
COPY apps/api/package.json ./apps/api/package.json

RUN yarn install --frozen-lockfile --production || yarn install --production

# Prisma client + compiled app
COPY --from=builder /app/apps/api/node_modules/.prisma ./apps/api/node_modules/.prisma
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]
