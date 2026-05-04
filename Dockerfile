# Use official Node.js as a base image
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the code
COPY . .

# Build frontend and backend
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Expose port (Cloud Run requires binding to 0.0.0.0, PORT is usually provided)
ENV PORT=3000
EXPOSE 3000

# Start server
CMD ["npm", "run", "start"]
