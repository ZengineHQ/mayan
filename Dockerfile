FROM node:16.20.2-alpine3.18

RUN npm install -g npm@8.19.4

RUN apk add --no-cache git \
    --repository https://alpine.global.ssl.fastly.net/alpine/v3.18/community \
    --repository https://alpine.global.ssl.fastly.net/alpine/v3.18/main

RUN apk update && \
  apk add openssh && \
  apk add zip

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm link

EXPOSE 1234 3000

WORKDIR /plugin

ENTRYPOINT ["mayan"]
