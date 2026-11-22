#!/bin/sh
set -e

echo "==> Starting NestJS server on port ${PORT:-4000}"

exec node dist/main
