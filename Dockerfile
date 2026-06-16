FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./backend/
RUN npm install --prefix backend --production=false

COPY web/package*.json ./web/
RUN npm install --prefix web

COPY . .

RUN npm run build --prefix web

EXPOSE 3000
CMD ["node", "backend/server.js"]
