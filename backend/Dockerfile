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

# Copy package files
COPY package*.json ./

# Install dependencies (use npm install instead of npm ci for development)
RUN npm install

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 4000

# Start application (runs verify-deps via npm start script)
CMD ["npm", "start"]
