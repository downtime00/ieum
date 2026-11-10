# 🏠 IEUM 백엔드 API 문서

<div align="center">
  <h3>IEUM 플랫폼 백엔드 서버</h3>
  <p>사용자 중심의 AI 기반 학습 및 커뮤니티 플랫폼</p>
  <p><strong>NestJS + TypeORM + PostgreSQL</strong></p>
</div>

---

## 📚 목차

- [프로젝트 소개](#-프로젝트-소개)
- [기능 목록](#-기능-목록)
- [시스템 아키텍처](#-시스템-아키텍처)
- [설치 및 실행](#-설치-및-실행)
  - [🐳 Docker 를 사용한 첫 실행 (권장)](#docker-를사용한첫실행권장)
  - [⚙️ 직접 설치 및 실행](#직접-설치-및-실행)
- [API 문서 및 기타 정보](#api-문서-및-기타-정보)

---

## 🏠 프로젝트 소개

IEUM 는 사용자 중심의 AI 기반 학습 및 커뮤니티 플랫폼입니다.

### 주요 기술 스택
- **Backend**: NestJS (TypeScript)
- **Database**: PostgreSQL + TypeORM
- **Cache**: Redis
- **Realtime**: WebSocket (Socket.io)

---

## 🎯 기능 목록

- [ ] 사용자 인증 및 권한 관리 (JWT)
- [ ] 가족 공유 시스템
- [ ] 콘텐츠 추천 엔진
- [ ] 관계 그래프 분석
- [ ] 실시간 알림 시스템
- [ ] 기관/조직 관리

---

## 🏗️ 시스템 아키텍처

IEUM 은 다음과 같은 기술 스택을 기반으로 구축되었습니다:

- **NestJS**: TypeScript 기반 엔드포인트 프레임워크로 백엔드를 개발했습니다.
- **TypeORM**: ORM 을 사용하여 데이터베이스를 효율적으로 관리합니다.
- **Redis**: 캐싱 및 세션 관리를 위해 사용됩니다.
- **Passport.js**: JWT 와 GitHub 등 다양한 인증 방식을 제공합니다.
- **Socket.io**: 실시간 알림 및 채팅 기능을 지원합니다.

---

## 🐳 Docker 를 사용한 첫 실행 (권장)

IEUM 은 Docker 를 사용하여 모든 서비스를 일괄적으로 배포할 수 있습니다.

### 환경 변수 설정

`.env` 파일을 생성하여 필요한 환경 변수를 설정합니다:

```bash
cd backend

# .env 파일 생성 및 예제 복사
cp .env.example .env

# .env 파일 내용 확인 및 수정
cat .env
```

### Docker Compose 로 모든 서비스 실행

`docker-compose.yml` 파일을 사용하여 다음 서비스를 한 번에 시작합니다:

- PostgreSQL 데이터베이스
- NestJS 백엔드 서버 (개발 모드)
- Redis 캐시 서비스

```bash
cd backend
docker-compose up -d
```

### 실행 결과 확인

실행된 컨테이너 상태를 확인합니다:

```bash
docker-compose ps
```

---

## ⚙️ 직접 설치 및 실행

Docker 를 사용하지 않고 직접 설치를 원하시는 경우 다음 단계를 따르세요:

1. **Node.js 설치**: 버전 20 이상 권장
2. **의존 관계 설치**: `npm install`
3. **환경 변수 설정**: `.env.example` 을 복사하여 수정
4. **데이터베이스 준비**: PostgreSQL 설치 또는 Docker 사용
5. **서버 시작**: `npm run start:dev`

---

## 📖 API 문서 및 기타 정보

API 문서, 엔드포인트 목록 등 추가 정보는 해당 섹션을 참조해주세요.







  <p>사용자 중심의 AI 기반 학습 및 커뮤니티 플랫폼</p>
## 📚 목차
- [기능 목록](#-기능-목록)

- [시스템 아키텍처](#-시스템-아키텍처)

- [설치 및 실행](#-설치-및-실행)
---
  - [🐳 Docker 를 사용한 첫 실행 (권장)](#docker-를사용한첫실행권장)
- [프로젝트 소개](#-프로젝트-소개)
- [API 문서 및 기타 정보](#api-문서-및-기타-정보)
  - [⚙️ 직접 설치 및 실행](#직접-설치-및-실행)
