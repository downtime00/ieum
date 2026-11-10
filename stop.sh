#!/bin/bash

# IEUM 서버 중지 스크립트
# 사용법: ./stop.sh [dev|docker]

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

MODE=${1:-dev}

echo "=========================================="
echo "   IEUM 서버 중지 스크립트"
echo "=========================================="
echo "모드: $MODE"
echo ""

case $MODE in
    dev)
        echo -e "${YELLOW}개발 서버 중지${NC}"
        
        # 실행 중인 프로세스 찾기
        BACKEND_PID=$(pgrep -f "nest start" || true)
        FRONTEND_PID=$(pgrep -f "nuxt dev" || true)
        
        if [ -n "$BACKEND_PID" ]; then
            echo "백엔드 중지 (PID: $BACKEND_PID)..."
            kill $BACKEND_PID
            echo -e "${GREEN}✓ 백엔드 중지 완료${NC}"
        else
            echo -e "${YELLOW}⚠ 백엔드가 실행 중이 아닙니다${NC}"
        fi
        
        if [ -n "$FRONTEND_PID" ]; then
            echo "프론트엔드 중지 (PID: $FRONTEND_PID)..."
            kill $FRONTEND_PID
            echo -e "${GREEN}✓ 프론트엔드 중지 완료${NC}"
        else
            echo -e "${YELLOW}⚠ 프론트엔드가 실행 중이 아닙니다${NC}"
        fi
        ;;
        
    docker)
        echo -e "${YELLOW}Docker 서버 중지${NC}"
        
        cd backend
        docker-compose down
        
        echo -e "${GREEN}✓ Docker 서버 중지 완료${NC}"
        ;;
        
    all)
        echo -e "${YELLOW}모든 서버 중지${NC}"
        
        # 개발 서버 중지
        BACKEND_PID=$(pgrep -f "nest start" || true)
        FRONTEND_PID=$(pgrep -f "nuxt dev" || true)
        
        if [ -n "$BACKEND_PID" ]; then
            kill $BACKEND_PID
            echo -e "${GREEN}✓ 백엔드 중지 완료${NC}"
        fi
        
        if [ -n "$FRONTEND_PID" ]; then
            kill $FRONTEND_PID
            echo -e "${GREEN}✓ 프론트엔드 중지 완료${NC}"
        fi
        
        # Docker 중지
        cd backend
        docker-compose down
        
        echo -e "${GREEN}✓ 모든 서버 중지 완료${NC}"
        ;;
        
    *)
        echo -e "${RED}잘못된 모드: $MODE${NC}"
        echo ""
        echo "사용법: ./stop.sh [dev|docker|all]"
        echo ""
        echo "  dev   - 개발 서버 중지"
        echo "  docker - Docker 컨테이너 중지"
        echo "  all   - 모든 서버 중지"
        exit 1
        ;;
esac
