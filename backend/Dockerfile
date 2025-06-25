# Dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript (if you're using it)
RUN npm run build

# Expose port (optional)
EXPOSE 4000

# Start app
CMD ["node", "dist/index.js"]
