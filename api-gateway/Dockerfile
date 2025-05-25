# ---------- STAGE 1: Development ----------
FROM node:18-alpine AS development

WORKDIR /usr/src/app

# Install all dependencies including devDependencies
COPY package*.json ./
RUN npm install

# Copy full source code
COPY . .

# Expose port
EXPOSE 3000

# Default command for development (you can override in docker-compose)
CMD ["npm", "run", "dev"]


# ---------- STAGE 2: Production ----------
FROM node:18-alpine AS production

WORKDIR /usr/src/app

# Copy only package files first for caching layer
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy only what's needed for production
COPY . .

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "src/server.js"]
