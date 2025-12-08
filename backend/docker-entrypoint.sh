#!/bin/sh
set -e

echo "Waiting for database to be ready..."

# Wait for database to be fully ready (even though docker-compose healthcheck exists, we add a small delay for safety)
sleep 2

echo "Running database migrations..."
npm run db:migrate

echo "Starting application..."
exec "$@"
