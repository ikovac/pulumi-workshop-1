FROM node:16.13.0
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm i
COPY ./ ./
RUN npm run build

EXPOSE 3000
CMD npm run db:migration:up && npm start
