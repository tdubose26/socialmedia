FROM node:22-alpine AS base
WORKDIR /app

COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
RUN npm ci --include=dev

COPY . .
RUN npm run build
RUN npm prune --omit=dev

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
