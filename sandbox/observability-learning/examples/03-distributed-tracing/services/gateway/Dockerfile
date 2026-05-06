FROM node:18-alpine

WORKDIR /app

# Copy shared tracing module
COPY ../../shared /shared

# Copy service files
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
