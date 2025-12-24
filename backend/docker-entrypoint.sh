#!/bin/sh
set -e

echo "Waiting for database to be ready..."

# Wait for database to be fully ready (even though docker-compose healthcheck exists, we add a small delay for safety)
sleep 2

echo "Running database migrations..."

# Use production migration script if NODE_ENV is production
if [ "$NODE_ENV" = "production" ]; then
  npm run db:migrate:prod
else
  npm run db:migrate
fi

echo "Starting application..."
exec "$@"

