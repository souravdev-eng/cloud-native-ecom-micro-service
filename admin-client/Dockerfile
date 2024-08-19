# FROM node:alpine
# WORKDIR '/app'
# RUN npm install -g pnpm
# COPY ./package.json .
# RUN pnpm install
# COPY . .

# CMD [ "npm","run","dev"]

# Stage 1: Install dependencies
FROM node:alpine AS deps
WORKDIR /app
RUN npm install -g pnpm
COPY ./package.json .
RUN pnpm install

# Stage 2: Build the final image
FROM node:alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

CMD ["npm", "run", "dev"]
