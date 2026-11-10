# IEUM Frontend (Nuxt) - Koyeb/컨테이너 배포용
FROM node:20-alpine AS builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci && npm cache clean --force

COPY frontend/ ./
RUN npm run build

FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/frontend/.output ./.output

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
