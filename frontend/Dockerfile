FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Expose port
EXPOSE 3000

# Start the application in development mode
CMD ["npm", "run", "dev"]