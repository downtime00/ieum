#!/bin/bash

# IEUM 프로젝트 원클릭 실행 스크립트
# 백엔드 API + 프론트엔드 + Redis를 함께 시작합니다.
# 사용법: ./run.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "=========================================="
echo "   IEUM 원클릭 실행 (API + Frontend + Redis)"
echo "=========================================="
echo ""

PIDS=()

cleanup() {
    echo ""
    echo -e "${YELLOW}서버를 종료합니다...${NC}"
    for pid in "${PIDS[@]}"; do
        kill "$pid" 2>/dev/null || true
    done
    # 백엔드/프론트엔드 자식 프로세스까지 정리
    pkill -f "ts-node src/main.ts" 2>/dev/null || true
    pkill -f "nodemon src/main.ts" 2>/dev/null || true
    pkill -f "nuxt dev" 2>/dev/null || true
    echo -e "${GREEN}✓ 종료 완료${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM

# ---------- 1. Redis 시작 ----------
echo -e "${YELLOW}[1/3] Redis 시작...${NC}"

REDIS_STARTED_BY_SCRIPT=false

if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✓ Redis 이미 실행 중${NC}"
    else
        echo "Redis 서버 시작 중..."
        if command -v brew &> /dev/null; then
            brew services start redis 2>/dev/null || redis-server --daemonize yes
        else
            redis-server --daemonize yes
        fi
        sleep 1
        if redis-cli ping &> /dev/null; then
            echo -e "${GREEN}✓ Redis 시작 완료${NC}"
        else
            echo -e "${RED}✗ Redis 시작 실패 (백엔드는 Redis 없이도 기동 시도합니다)${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠ redis-cli 없음 → Homebrew로 Redis 설치 시도${NC}"
    if command -v brew &> /dev/null; then
        brew install redis
        brew services start redis
        sleep 1
        echo -e "${GREEN}✓ Redis 설치 및 시작 완료${NC}"
    else
        echo -e "${RED}✗ Redis를 설치할 수 없습니다. brew가 필요합니다.${NC}"
    fi
fi
echo ""

# ---------- 2. 백엔드 API 시작 ----------
echo -e "${YELLOW}[2/3] 백엔드 API 시작 (port 3001)...${NC}"
cd "$(dirname "$0")/backend"

if [ ! -d node_modules ]; then
    echo "의존성 설치 중..."
    npm install
fi

npm run start:dev &
BACKEND_PID=$!
PIDS+=($BACKEND_PID)
echo -e "${GREEN}✓ 백엔드 시작됨 (PID: $BACKEND_PID)${NC}"
cd ..
echo ""

# ---------- 3. 프론트엔드 시작 ----------
echo -e "${YELLOW}[3/3] 프론트엔드 시작 (port 3000)...${NC}"
cd "$(dirname "$0")/frontend"

if [ ! -d node_modules ]; then
    echo "의존성 설치 중..."
    npm install
fi

npm run dev &
FRONTEND_PID=$!
PIDS+=($FRONTEND_PID)
echo -e "${GREEN}✓ 프론트엔드 시작됨 (PID: $FRONTEND_PID)${NC}"
cd ..
echo ""

echo "=========================================="
echo -e "${GREEN}   모든 서버 시작 완료!${NC}"
echo "=========================================="
echo ""
echo "  프론트엔드: http://localhost:3000"
echo "  백엔드 API: http://localhost:3001"
echo "  API 문서:   http://localhost:3001/api-docs"
echo ""
echo "중지: Ctrl+C"
echo ""

# 백그라운드 프로세스 대기
wait
