# Dockerfile for Smithery deployment
# Builds TypeScript MCP server with HTTP transport (no native dependencies)

FROM node:22-slim

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies for TypeScript build)
RUN npm ci

# Copy source files
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript to JavaScript
RUN npm run build

# Remove devDependencies to slim down
RUN npm prune --omit=dev

# Set production environment
ENV NODE_ENV=production

# Expose port for HTTP transport
EXPOSE 3000

# Run HTTP server (start command in smithery.yaml overrides this)
CMD ["node", "dist/http.js"]
