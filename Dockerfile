# syntax=docker/dockerfile:1

# ---------- Build: static Astro site ----------
# Debian-based (glibc) image: matches the Linux binaries in package-lock.json (Rolldown, sharp).
FROM node:26-slim AS build
WORKDIR /app

ENV ASTRO_TELEMETRY_DISABLED=1 \
    npm_config_fund=false \
    npm_config_audit=false \
    npm_config_update_notifier=false

# Install dependencies first so this layer is cached until the lockfile changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Public URL used for canonical links, the sitemap, robots.txt and structured data.
# Set it when building for a real domain: docker build --build-arg SITE=https://example.com .
ARG SITE=http://localhost:8080
# The container serves the site from the domain root.
ENV SITE=${SITE} \
    BASE_PATH=/
RUN npm run build

# ---------- Runtime: unprivileged nginx serving the static files ----------
# Runs as a non-root user and listens on 8080.
FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /srv/www

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
