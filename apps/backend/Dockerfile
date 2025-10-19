# Multi-stage build for cbrief backend
# Stage 1: Node + Python + Static Analysis Tools

FROM node:20-bullseye-slim

# Install Python and dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Install static analysis tools
RUN pip3 install --no-cache-dir \
    pbr \
    semgrep==1.52.0 \
    bandit==1.7.5

# Verify installations
RUN semgrep --version && bandit --version

# Install pnpm
RUN npm install -g pnpm@9.0.0

# Set working directory
WORKDIR /app

# Copy package files from monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/backend ./apps/backend
COPY packages/shared ./packages/shared

# Build shared package first
WORKDIR /app/packages/shared
RUN pnpm build

# Build backend
WORKDIR /app/apps/backend
RUN pnpm build

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "dist/index.js"]
