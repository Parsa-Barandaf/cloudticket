#!/bin/sh
set -e

echo "==> Applying Prisma migrations (prisma migrate deploy)"
npx prisma migrate deploy

if [ "$RUN_SEED" = "true" ]; then
  echo "==> Seeding database (RUN_SEED=true)"
  npx tsx prisma/seed.ts
fi

echo "==> Starting NestJS server on port ${PORT:-4000}"
exec node dist/main