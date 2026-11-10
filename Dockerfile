# IEUM Backend - Koyeb/컨테이너 배포용
FROM node:20-alpine AS builder

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --legacy-peer-deps && npm cache clean --force

COPY backend/ .
RUN npm run build

FROM node:20-alpine

WORKDIR /app/backend

COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
COPY backend/package*.json ./

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/main.js"]
