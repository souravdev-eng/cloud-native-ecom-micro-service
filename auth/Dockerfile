# Multi-stage Dockerfile for Auth Service
FROM node:18-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

# Development stage
FROM base AS development
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN pnpm install
COPY . .
CMD ["npm", "start"]

# Production stage
FROM base AS production
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN pnpm install --prod
COPY . .
RUN npm run build
CMD ["npm", "start"]