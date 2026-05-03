# Use Node.js standard image to ensure native dependencies (like solana web3) can compile
FROM node:20 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies required for Vite build)
RUN npm install

# Copy application code
COPY . .

# Build the frontend (outputs to /app/dist)
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Copy package info
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy server code
COPY server.js ./

# Copy built frontend assets from builder stage
COPY --from=builder /app/dist ./dist

# Standard Cloud Run port
ENV PORT=8080
EXPOSE 8080

# Force production mode
ENV NODE_ENV=production

# Start the application
CMD ["node", "server.js"]
