# ---------- Build stage: frontend + backend ----------
FROM node:20-slim AS build

# Backend dependencies
WORKDIR /app/backend
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY backend/package.json backend/package-lock.json ./
RUN npm ci

# Backend source
COPY backend/ .
RUN npx prisma generate
RUN npm run build

# Frontend project
WORKDIR /app/frontend
COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.ts tsconfig.json ./
COPY src ./src

# API URL baked into the browser bundle.
# Same-origin (/graphql) because NestJS serves the built frontend in production.
ARG VITE_API_URL=/graphql
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---------- Runtime stage ----------
FROM node:20-slim

WORKDIR /app/backend

ENV NODE_ENV=production
ENV PORT=4000

# openssl CLI lets Prisma detect the libssl version to use for its bundled engines
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Install dependencies required for runtime and database migrations
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --include=dev

# Prisma schema, migrations and the generated GraphQL schema
COPY backend/prisma ./prisma
COPY backend/src/schema.gql ./src/schema.gql
RUN npx prisma generate

# Compiled NestJS app
COPY --from=build /app/backend/dist ./dist

# Built frontend (served by NestJS from /public)
COPY --from=build /app/frontend/dist ./public

# Entrypoint (start NestJS application)
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["/docker-entrypoint.sh"]
