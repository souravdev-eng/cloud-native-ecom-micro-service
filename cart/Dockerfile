FROM node:alpine

WORKDIR '/app'

COPY ./package.json .

RUN yarn add glob rimraf
RUN yarn --only=prod

COPY . .

CMD [ "npm","start"]
