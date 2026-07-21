FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json yarn.lock ./
COPY apps/api/package.json ./apps/api/
COPY apps/client/package.json ./apps/client/
COPY packages/shared-types/package.json ./packages/shared-types/
RUN yarn install --frozen-lockfile --ignore-scripts

FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY --from=deps /app/ ./
COPY packages/shared-types ./packages/shared-types
RUN yarn workspace @task-manager/shared-types build

COPY apps/api ./apps/api
RUN yarn workspace api prisma:generate && yarn workspace api build

RUN mkdir -p /out/apps/api /out/packages \
  && cp -a package.json yarn.lock node_modules /out/ \
  && cp -a packages/shared-types /out/packages/ \
  && cp -a apps/api/package.json apps/api/dist apps/api/prisma /out/apps/api/

FROM node:22-alpine
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV API_PORT=3001

RUN addgroup -S nodejs && adduser -S nestjs -G nodejs
COPY --from=builder --chown=nestjs:nodejs /out/ ./

USER nestjs
EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]
