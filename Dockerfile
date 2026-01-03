# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy configuration files
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies including devDependencies for building
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production environment
FROM node:20-alpine AS runner

WORKDIR /app

# Set to production
ENV NODE_ENV=production

# Copy package.json and install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy the built application from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"]