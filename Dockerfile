# IEUM Backend - Koyeb/컨테이너 배포용
FROM node:20-alpine AS builder

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --legacy-peer-deps && npm cache clean --force

COPY backend/ .
RUN npm run build

FROM node:20-alpine

# 컨테이너 내부 Redis 함께 실행
RUN apk add --no-cache redis

WORKDIR /app/backend

COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
COPY backend/package*.json ./

ENV NODE_ENV=production
ENV REDIS_URL=redis://localhost:6379

EXPOSE 3000

CMD ["sh", "-c", "redis-server --daemonize yes --save '' --appendonly no && node dist/main.js"]
