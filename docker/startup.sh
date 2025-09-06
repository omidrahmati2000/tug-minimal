#!/bin/bash
set -e

echo "🚀 Starting MyFuel Application..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
npx wait-port postgres:5432 -t 30000

# Run migrations (if you switch from synchronize to migrations)
# echo "🔄 Running database migrations..."
# npm run typeorm migration:run

# Run seeders
echo "🌱 Running database seeders..."
npm run seed

echo "✅ Database setup completed!"

# Start the application
echo "🎯 Starting application server..."
exec "$@"