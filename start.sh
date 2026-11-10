#!/bin/bash

# IEUM 프로젝트 시작 스크립트
# 사용법: ./start.sh [dev|prod|docker]

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

MODE=${1:-dev}

echo "=========================================="
echo "   IEUM 서버 시작 스크립트"
echo "=========================================="
echo "모드: $MODE"
echo ""

case $MODE in
    dev)
        echo -e "${YELLOW}개발 서버 시작 (Development Mode)${NC}"
        echo ""

        # Docker 및 데이터베이스 상태 확인
        echo "Docker 및 데이터베이스 상태 확인 중..."
        if ! command -v docker &> /dev/null; then
            echo -e "${RED}✗ Docker가 설치되어 있지 않습니다.${NC}"
            echo "Docker Desktop를 설치하거나 로컬 PostgreSQL을 사용하세요."
            echo "로컬 PostgreSQL 사용: ./start.sh db"
            exit 1
        fi

        if ! docker info &> /dev/null; then
            echo -e "${YELLOW}Docker가 실행 중이 아닙니다. Docker Desktop를 시작합니다...${NC}"
            open -a Docker
            echo "Docker가 시작될 때까지 기다리는 중..."
            for i in {1..30}; do
                if docker info &> /dev/null; then
                    echo -e "${GREEN}✓ Docker 시작 완료${NC}"
                    break
                fi
                echo -n "."
                sleep 2
            done
            echo ""
            if ! docker info &> /dev/null; then
                echo -e "${RED}✗ Docker 시작 실패${NC}"
                echo "Docker Desktop를 수동으로 시작한 후 다시 시도하세요."
                exit 1
            fi
        else
            echo -e "${GREEN}✓ Docker 실행 중${NC}"
        fi

        # Docker 컨테이너 상태 확인 및 시작
        echo "데이터베이스 컨테이너 확인 중..."
        if ! docker ps | grep -q "ieum-postgres"; then
            echo "PostgreSQL 컨테이너 시작 중..."
            docker-compose up -d postgres redis
            echo -e "${GREEN}✓ 데이터베이스 컨테이너 시작 완료${NC}"
            echo "데이터베이스 연결 대기 중..."
            for i in {1..15}; do
                if docker exec ieum-postgres pg_isready -U postgres &> /dev/null; then
                    echo -e "${GREEN}✓ 데이터베이스 연결 완료${NC}"
                    break
                fi
                echo -n "."
                sleep 2
            done
            echo ""
        else
            echo -e "${GREEN}✓ 데이터베이스 컨테이너 실행 중${NC}"
        fi

        echo ""
        
        # 백엔드 시작 (백그라운드)
        echo "백엔드 시작 중..."
        cd backend
        npm run start:dev &
        BACKEND_PID=$!
        cd ..
        
        # 프론트엔드 시작 (백그라운드)
        echo "프론트엔드 시작 중..."
        cd frontend
        npm run dev &
        FRONTEND_PID=$!
        cd ..
        
        echo -e "${GREEN}✓ 개발 서버 시작 완료${NC}"
        echo ""
        echo "백엔드 PID: $BACKEND_PID"
        echo "프론트엔드 PID: $FRONTEND_PID"
        echo ""
        echo "중지하려면 Ctrl+C를 누르세요"
        
        # 프로세스 종료 대기
        trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
        wait
        ;;
        
    prod)
        echo -e "${YELLOW}프로덕션 서버 시작 (Production Mode)${NC}"
        echo ""
        
        cd backend
        npm run start:prod
        ;;
        
    docker)
        echo -e "${YELLOW}Docker 서버 시작${NC}"
        echo ""
        
        cd backend
        docker-compose up -d
        
        echo -e "${GREEN}✓ Docker 서버 시작 완료${NC}"
        echo ""
        echo "상태 확인: docker-compose ps"
        echo "로그 확인: docker-compose logs -f"
        echo "중지: docker-compose down"
        ;;
        
    db)
        echo -e "${YELLOW}데이터베이스만 시작 (로컬 PostgreSQL)${NC}"
        echo ""
        
        # macOS Homebrew 확인
        if command -v brew &> /dev/null; then
            if brew services list | grep -q postgresql; then
                echo "PostgreSQL 서비스 시작 중..."
                brew services start postgresql
                echo -e "${GREEN}✓ PostgreSQL 시작 완료${NC}"
            else
                echo -e "${YELLOW}PostgreSQL 설치 중...${NC}"
                brew install postgresql@15
                brew services start postgresql
                echo -e "${GREEN}✓ PostgreSQL 설치 및 시작 완료${NC}"
            fi
        else
            echo -e "${RED}Homebrew가 설치되어 있지 않습니다.${NC}"
            echo "Docker를 사용하거나 PostgreSQL을 직접 설치해주세요."
            exit 1
        fi
        
        # 데이터베이스 생성
        echo "데이터베이스 생성 중..."
        if ! psql -U postgres -lqt | grep -q ieum; then
            createdb -U postgres ieum
            echo -e "${GREEN}✓ 데이터베이스 생성 완료${NC}"
        else
            echo -e "${GREEN}✓ 데이터베이스 이미 존재${NC}"
        fi
        ;;
        

    backend)
        echo -e "${YELLOW}백엔드만 시작${NC}"
        echo ""
        
        cd backend
        npm run start:dev
        ;;
        
    frontend)
        echo -e "${YELLOW}프론트엔드만 시작${NC}"
        echo ""
        
        cd frontend
        npm run dev
        ;;
        
    *)
        echo -e "${RED}잘못된 모드: $MODE${NC}"
        echo ""
        echo "사용법: ./start.sh [dev|prod|docker]"
        echo ""
        echo "  dev    - 개발 서버 (백엔드 + 프론트엔드)"
        echo "  prod   - 프로덕션 서버 (백엔드만)"
        echo "  docker - Docker 컨테이너"
        exit 1
        ;;
esac
