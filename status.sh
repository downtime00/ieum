#!/bin/bash

# IEUM 서버 상태 확인 스크립트
# 사용법: ./status.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "=========================================="
echo "   IEUM 서버 상태 확인"
echo "=========================================="
echo ""

# 개발 서버 상태
echo -e "${YELLOW}개발 서버 상태:${NC}"
BACKEND_PID=$(pgrep -f "nest start" || true)
FRONTEND_PID=$(pgrep -f "nuxt dev" || true)

if [ -n "$BACKEND_PID" ]; then
    echo -e "${GREEN}✓ 백엔드 실행 중 (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}✗ 백엔드 중지됨${NC}"
fi

if [ -n "$FRONTEND_PID" ]; then
    echo -e "${GREEN}✓ 프론트엔드 실행 중 (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}✗ 프론트엔드 중지됨${NC}"
fi
echo ""

# Docker 상태
echo -e "${YELLOW}Docker 컨테이너 상태:${NC}"
if command -v docker &> /dev/null; then
    cd backend
    docker-compose ps
    cd ..
else
    echo -e "${YELLOW}⚠ Docker가 설치되어 있지 않습니다${NC}"
fi
echo ""

# 포트 상태
echo -e "${YELLOW}포트 상태:${NC}"
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${GREEN}✓ 포트 $1 사용 중${NC}"
    else
        echo -e "${RED}✗ 포트 $1 사용 안 함${NC}"
    fi
}

check_port 3000  # 프론트엔드
check_port 3001  # 백엔드
check_port 5432  # PostgreSQL
check_port 6379  # Redis
echo ""

# 데이터베이스 연결 테스트
echo -e "${YELLOW}데이터베이스 연결 테스트:${NC}"
if lsof -Pi :5432 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    if command -v psql &> /dev/null; then
        if PGPASSWORD=postgres psql -h localhost -U postgres -d ieum -c "SELECT 1" &> /dev/null; then
            echo -e "${GREEN}✓ PostgreSQL 연결 성공${NC}"
        else
            echo -e "${RED}✗ PostgreSQL 연결 실패${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ psql이 설치되어 있지 않습니다${NC}"
    fi
else
    echo -e "${YELLOW}⚠ PostgreSQL이 실행 중이 아닙니다${NC}"
fi
echo ""

echo "=========================================="
