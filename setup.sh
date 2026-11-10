#!/bin/bash

# IEUM 프로젝트 설치 스크립트
# 사용법: ./setup.sh

set -e  # 오류 발생 시 스크립트 중단

echo "=========================================="
echo "   IEUM 프로젝트 설치 자동화 스크립트"
echo "=========================================="
echo ""

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Node.js 버전 체크
check_node_version() {
    echo -e "${YELLOW}Node.js 버전 확인 중...${NC}"
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -lt 20 ]; then
            echo -e "${RED}Node.js v20 이상이 필요합니다. 현재 버전: $(node -v)${NC}"
            exit 1
        fi
        echo -e "${GREEN}✓ Node.js 버전 적합: $(node -v)${NC}"
    else
        echo -e "${RED}Node.js가 설치되어 있지 않습니다.${NC}"
        exit 1
    fi
    echo ""
}

# 백엔드 설치
install_backend() {
    echo -e "${YELLOW}백엔드 설치 중...${NC}"
    cd backend
    
    # 의존성 설치
    echo "npm install 실행 중..."
    npm install
    
    # 환경 변수 설정
    if [ ! -f .env ]; then
        echo ".env 파일 생성 중..."
        cp .env.example .env
        echo -e "${GREEN}✓ .env 파일 생성 완료${NC}"
    else
        echo -e "${GREEN}✓ .env 파일 이미 존재${NC}"
    fi
    
    # 빌드
    echo "TypeScript 빌드 중..."
    npm run build
    
    echo -e "${GREEN}✓ 백엔드 설치 완료${NC}"
    cd ..
    echo ""
}

# 프론트엔드 설치
install_frontend() {
    echo -e "${YELLOW}프론트엔드 설치 중...${NC}"
    cd frontend
    
    # 의존성 설치
    echo "npm install 실행 중..."
    npm install
    
    # 빌드
    echo "Nuxt 빌드 중..."
    npm run build
    
    echo -e "${GREEN}✓ 프론트엔드 설치 완료${NC}"
    cd ..
    echo ""
}

# Docker 설치 확인
check_docker() {
    echo -e "${YELLOW}Docker 설치 확인 중...${NC}"
    if command -v docker &> /dev/null; then
        echo -e "${GREEN}✓ Docker 설치됨: $(docker --version)${NC}"
    else
        echo -e "${YELLOW}⚠ Docker가 설치되어 있지 않습니다. Docker 사용을 건너뜁니다.${NC}"
    fi
    echo ""
}

# 메인 실행
main() {
    check_node_version
    install_backend
    install_frontend
    check_docker
    
    echo "=========================================="
    echo -e "${GREEN}   설치 완료!${NC}"
    echo "=========================================="
    echo ""
    echo "다음 명령어로 서버를 시작하세요:"
    echo ""
    echo "백엔드 개발 서버:"
    echo "  cd backend && npm run start:dev"
    echo ""
    echo "프론트엔드 개발 서버:"
    echo "  cd frontend && npm run dev"
    echo ""
    echo "Docker로 전체 실행:"
    echo "  cd backend && docker-compose up -d"
    echo ""
}

main
