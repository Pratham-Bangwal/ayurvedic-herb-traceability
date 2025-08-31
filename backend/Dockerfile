FROM node:18

WORKDIR /usr/src/app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install deps
RUN npm install --legacy-peer-deps

# Copy rest of backend source
COPY . .

EXPOSE 4000

CMD ["npm", "start"]
