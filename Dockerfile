# FROM appveen/angular.base:11
FROM node:18-alpine

WORKDIR /app

RUN npm install -g npm
RUN npm install -g @angular/cli@15.2.10

COPY package.json .
RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build-prod

# RUN npm run build