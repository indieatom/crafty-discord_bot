# =====================================
# Optimized Multi-Stage Build for Crafty Discord Bot
# =====================================

# =====================================
# Stage 1: Dependencies & Build
# =====================================
FROM node:18-alpine AS builder

# Install build tools in a single layer (only what's needed)
RUN apk add --no-cache python3 make g++ && \
    ln -sf python3 /usr/bin/python

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Optimize npm ci with performance flags
RUN npm ci \
    --prefer-offline \
    --no-audit \
    --no-fund \
    --include=dev \
    --frozen-lockfile

# Copy source code (after dependencies for better cache)
COPY . .

# Build the application (with explicit project path)
RUN ./node_modules/.bin/tsc -p ./tsconfig.json

# =====================================
# Stage 2: Production Runtime (Optimized)
# =====================================
FROM node:18-alpine AS production

WORKDIR /app

# Create non-root user first
RUN addgroup -g 1001 -S nodejs && \
    adduser -S botuser -u 1001 -G nodejs

# Install only essential runtime packages
RUN apk add --no-cache ca-certificates tzdata

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies directly (much faster)
RUN npm ci \
    --prefer-offline \
    --no-audit \
    --no-fund \
    --omit=dev \
    --frozen-lockfile && \
    npm cache clean --force

# Copy built application
COPY --from=builder --chown=botuser:nodejs /app/dist ./dist

# Create logs directory and set permissions
RUN mkdir -p /app/logs && \
    chown -R botuser:nodejs /app

# Switch to non-root user
USER botuser

# Environment variables
ENV NODE_ENV=production \
    LOG_LEVEL=info \
    NPM_CONFIG_CACHE=/tmp/.npm

# Health check (optimized)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=2 \
    CMD node -e "process.exit(0)"

# Expose port for potential future web interface
EXPOSE 3000

# Start the bot
CMD ["node", "dist/index.js"]
