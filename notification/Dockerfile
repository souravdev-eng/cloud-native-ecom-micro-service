FROM node:alpine
WORKDIR '/app'
RUN npm install -g pnpm

COPY ./package.json .
RUN pnpm install --ignore-scripts
COPY . .

CMD [ "npm","start"]