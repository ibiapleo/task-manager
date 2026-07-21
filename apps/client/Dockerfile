FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json yarn.lock ./
COPY apps/api/package.json ./apps/api/
COPY apps/client/package.json ./apps/client/
COPY packages/shared-types/package.json ./packages/shared-types/
RUN yarn install --frozen-lockfile --ignore-scripts

FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY --from=deps /app/ ./
COPY packages/shared-types ./packages/shared-types
RUN yarn workspace @task-manager/shared-types build

COPY apps/client ./apps/client

ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_TELEMETRY_DISABLED=1

RUN yarn workspace client build

RUN mkdir -p /out \
  && cp -a apps/client/.next/standalone/. /out/ \
  && mkdir -p /out/apps/client/.next \
  && cp -a apps/client/.next/static /out/apps/client/.next/static \
  && cp -a apps/client/public /out/apps/client/public

FROM node:22-alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=builder --chown=nextjs:nodejs /out/ ./

USER nextjs
EXPOSE 3000
CMD ["node", "apps/client/server.js"]
