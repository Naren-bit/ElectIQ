# Use official Node.js Alpine image for a small footprint
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Copy application code
COPY backend/ ./backend/
COPY public/ ./public/

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy built node_modules and app code from builder
COPY --from=builder /app /app

# Expose the application port
EXPOSE 3001

# Set production environment
ENV NODE_ENV=production
ENV PORT=3001

# Run the server
CMD ["node", "backend/src/server.js"]
