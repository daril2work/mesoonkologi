# ============================================================
# MESO App - Multi-Stage Dockerfile
# ============================================================

# ── Stage 1: Builder ──────────────────────────────────────
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies (clean install)
RUN npm ci --frozen-lockfile

# Copy source code
COPY . .

# Build the app
RUN npm run build

# ── Stage 2: Runner (Nginx) ───────────────────────────────
FROM nginx:alpine AS runner

# Copy Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
