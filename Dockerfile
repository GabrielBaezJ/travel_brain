## Build stage: install PHP dependencies with Composer
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock* ./
# Install PHP deps in build stage. The composer image doesn't have ext-mongodb, so
# we ignore that platform requirement here; the runtime stage will install the PECL extension.
RUN composer install \
    --no-dev \
    --no-scripts \
    --prefer-dist \
    --no-interaction \
    --optimize-autoloader \
    --ignore-platform-req=ext-mongodb
COPY . .
RUN composer dump-autoload -o

## Runtime stage: PHP CLI with built-in server (simple, no Apache/Nginx)
FROM php:8.2-cli-alpine AS runtime
WORKDIR /app

# Install system deps for pecl and MongoDB extension
# Note: composer.lock pins mongodb/mongodb to 1.19.1. That library is compatible with ext-mongodb 1.18–1.19.
# Newer PECL (e.g., 1.20+) adds strict return types causing signature mismatches with 1.19.1.
# Pin PECL to a compatible 1.19.x to avoid "must be compatible with ... bsonSerialize()" fatals.
RUN apk add --no-cache $PHPIZE_DEPS openssl-dev && \
    pecl install mongodb-1.19.1 && docker-php-ext-enable mongodb && \
    apk del --no-cache $PHPIZE_DEPS

# Copy app sources and vendor from builder
COPY --from=vendor /app /app

# Render sets PORT; default to 8080 for local runs
ENV PORT=8080
EXPOSE 8080

# Start PHP built-in server pointing to public/ and use index.php as router (front controller)
CMD ["sh", "-c", "php -S 0.0.0.0:${PORT} -t public public/index.php"]
