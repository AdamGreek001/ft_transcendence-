#!/bin/sh
set -e

echo "Running TypeORM migrations..."
npx typeorm migration:run -d dist/config/data-source.js || echo "No pending migrations."

echo "Starting NestJS application..."
exec node dist/main.js
