FROM node:14-alpine

RUN apk update && apk upgrade
ENV NODE_ENV=production

WORKDIR /app

COPY package*.json index.js ./

RUN npm ci --omit=dev

ENTRYPOINT ["node", "index.js"]
