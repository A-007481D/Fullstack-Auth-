# ─────────────────────────────────────────────────────────────────
# Backend Dockerfile — Laravel 11 + PHP 8.3 FPM + Nginx
# ─────────────────────────────────────────────────────────────────
#
# Multi-stage build:
# Stage 1 (composer-deps): Install PHP dependencies using Composer
# Stage 2 (production):    Final image with PHP-FPM + Nginx + app code
#
# Why multi-stage?
# - The Composer image is large (~500MB). We only need the vendor/ output.
# - The final image doesn't include Composer — smaller attack surface.
# ─────────────────────────────────────────────────────────────────

# ── Stage 1: Install Composer dependencies ──────────────────────
FROM composer:2.7 AS composer-deps

WORKDIR /app

# Copy only dependency manifests first — Docker layer caching:
# If composer.json/lock haven't changed, this layer is reused on rebuild.
COPY composer.json composer.lock* ./

RUN composer install \
    --no-dev \
    --no-interaction \
    --no-scripts \
    --prefer-dist \
    --optimize-autoloader

# ── Stage 2: Production image ───────────────────────────────────
FROM php:8.3-fpm-alpine

LABEL maintainer="TaskManagement App"

# Install system dependencies and PHP extensions
RUN apk add --no-cache \
    nginx \
    supervisor \
    curl \
    libpq-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    libwebp-dev \
    zip \
    unzip \
    && docker-php-ext-configure pgsql -with-pgsql=/usr/local/pgsql \
    && docker-php-ext-install \
        pdo \
        pdo_pgsql \
        pgsql \
        opcache \
        gd \
        bcmath \
    && rm -rf /var/cache/apk/*

# Copy vendor from composer stage (no Composer binary in final image)
COPY --from=composer-deps /app/vendor /var/www/html/vendor

# Copy application source code
COPY . /var/www/html

WORKDIR /var/www/html

# Set correct permissions — PHP-FPM runs as www-data
RUN chown -R www-data:www-data /var/www/html/storage \
    && chown -R www-data:www-data /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage \
    && chmod -R 775 /var/www/html/bootstrap/cache

# Copy Nginx and Supervisor config files
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/php.ini /usr/local/etc/php/conf.d/custom.ini

# Copy and configure entrypoint script
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Create supervisor log directories
RUN mkdir -p /var/log/supervisor /var/log/php-fpm

EXPOSE 8000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# Supervisord runs both Nginx and PHP-FPM in the same container
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
