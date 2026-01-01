# Dockerfile for Smithery deployment
# Builds TypeScript MCP server without native dependencies

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

# The start command is defined in smithery.yaml
CMD ["node", "dist/index.js"]
