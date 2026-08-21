#!/bin/sh
set -e

# ─────────────────────────────────────────────────────────────────
# Docker Entrypoint for Laravel Backend
# ─────────────────────────────────────────────────────────────────
# This script runs before the main process (supervisord).
# It handles first-time setup and database preparation.
# ─────────────────────────────────────────────────────────────────

echo "⏳ Starting Task Management API..."

# Copy .env.example to .env if .env doesn't exist yet
if [ ! -f /var/www/html/.env ]; then
    echo "📄 Creating .env from .env.example..."
    cp /var/www/html/.env.example /var/www/html/.env
fi

# Generate app key if not set (required for encryption)
if [ -z "$(grep -E '^APP_KEY=.+' /var/www/html/.env)" ]; then
    echo "🔑 Generating application key..."
    php artisan key:generate --ansi
fi

# Wait for PostgreSQL to be ready (Docker Compose starts services in parallel)
echo "⏳ Waiting for database to be ready..."
until php artisan db:monitor --max=60 2>/dev/null || \
      php -r "new PDO('pgsql:host='.getenv('DB_HOST').';port='.getenv('DB_PORT').';dbname='.getenv('DB_DATABASE'), getenv('DB_USERNAME'), getenv('DB_PASSWORD'));" 2>/dev/null; do
    echo "   Database not ready yet — retrying in 2s..."
    sleep 2
done

echo "✅ Database is ready!"

# Run migrations — --force required in non-interactive (production) mode
echo "🗄️  Running migrations..."
php artisan migrate --force

# Run seeders only if users table is empty (idempotent — safe to re-run)
USER_COUNT=$(php artisan tinker --execute="echo App\Models\User::count();" 2>/dev/null | tail -1)
if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
    echo "🌱 Seeding database with test data..."
    php artisan db:seed --force
else
    echo "⏭️  Database already seeded — skipping."
fi

# Clear and cache config for performance
php artisan config:cache
php artisan route:cache

echo "🚀 Application ready! Starting services..."

# Hand off to supervisord (runs nginx + php-fpm)
exec "$@"
