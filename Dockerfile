FROM node:24.14.1-alpine3.22

RUN npm install -g npm@11.11.0

RUN apk add --no-cache git \
    --repository https://alpine.global.ssl.fastly.net/alpine/v3.22/community \
    --repository https://alpine.global.ssl.fastly.net/alpine/v3.22/main

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
