FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["npx", "nodemon", "--watch", "src", "--watch", "server.js", "--legacy-watch", "--polling-interval", "1000", "server.js"]
