# 다층형 Docker 빌드 최적화
FROM node:18-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사 (layer caching 활용)
COPY package*.json ./

# 의존성 설치 (--legacy-peer-deps 필요 시 주석 해제)
RUN npm ci --legacy-peer-deps && npm cache clean --force

# 소스 코드 복사
COPY . .

# TypeScript 컴파일
RUN npm run build

# 프로덕션 이미지에 최종 빌드 결과만 포함
FROM node:18-alpine

WORKDIR /app

# package.json 은 개발용이므로 dist/ 만 필요한 의존성 설치
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
# (필요한 경우) COPY --from=builder /app/package*.json ./

# 환경 변수 설정
ENV NODE_ENV=${NODE_ENV:-production}
# 샘플 데이터 로드 여부 설정 (개발용)
ENV SEED_DATA=${SEED_DATA:-false}

# 오픈 파일 핸들러 증가 (Node.js 대용량 처리 시 필요)
RUN sysctl -w kernel.file-max=204800 && ulimit -n 65536

# 포트 3000 개방
EXPOSE 3000

# 애플리케이션 시작 (SEED_DATA=true 일 경우 자동 시드 실행)
CMD ["sh", "-c", "if [ \"$SEED_DATA\" = \"true\" ]; then node dist/main.js; else npm run start:prod; fi"]