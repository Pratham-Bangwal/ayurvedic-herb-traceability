# Stage 1: Install dependencies
FROM node:18-alpine AS deps
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm install --only=production

# Stage 2: Build and run
FROM node:18-alpine
WORKDIR /usr/src/app

# Copy only built deps from first stage
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Copy source code
COPY . .

# Expose port
EXPOSE 4000

# Start app
CMD ["npm", "start"]
