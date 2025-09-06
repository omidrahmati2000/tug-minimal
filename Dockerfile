# Production Dockerfile - Multi-stage build
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./

# Dependencies stage
FROM base AS dependencies
RUN npm ci --only=production

# Build stage
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --production

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Copy built application and dependencies
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/package*.json ./

# Copy startup script and seeder
COPY --chown=nestjs:nodejs docker/startup.sh ./startup.sh
COPY --from=build --chown=nestjs:nodejs /app/src/database ./src/database

# Switch to root to change permissions, then back to nestjs
USER root
RUN chmod +x startup.sh
USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/health-check.js || exit 1

# Expose port from environment variable (default 3001)
EXPOSE ${PORT:-3001}

CMD ["node", "dist/main.js"]