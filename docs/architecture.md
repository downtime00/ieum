# Architecture

## 개요
지역생활 정보 플랫폼은 여러 기관의 공지, 행사, 프로그램, 문화정보 등을 통합하여 사용자에게 개인화된 정보를 제공하는 서비스입니다.

## 핵심 목표
- 여러 기관의 홈페이지나 앱을 각각 찾아다니지 않아도 사용자의 지역과 관심사에 맞는 정보를 자동으로 발견
- "이런 거 어때요?" 추천 기능을 통해 사용자가 직접 검색하지 않아도 필요한 정보 제공
- 고령층을 고려한 단순하고 명확한 UX

## 시스템 구조

```
┌─────────────────────────────────────────────────────────────┐
│                        사용자                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                             │
│                    Vue 3 + Nuxt + PWA                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend API                             │
│                    NestJS Modular Monolith                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │   Auth   │ │  Users   │ │ Contents │ │   Recs   │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │   Orgs   │ │   Notif  │ │  Family  │ │  Common  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────────┐    ┌─────────────────────────────┐
│        PostgreSQL           │    │           Redis             │
│    (Source of Truth)        │    │    Cache / Session / Queue)│
└─────────────────────────────┘    └─────────────────────────────┘
              ▲
              │
┌─────────────────────────────────────────────────────────────┐
│                   Data Collection                            │
│              (Scheduler / Worker)                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              DataSourceAdapter                       │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │  │
│  │  │  Culture │ │   Seoul  │ │  Public  │  ...       │  │
│  │  │   API    │ │   API    │ │   Data   │            │  │
│  │  └──────────┘ └──────────┘ └──────────┘            │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│                   External APIs                             │
│  • 문화체육관광부 문화포털 Open API                          │
│  • 서울시 API                                               │
│  • 공공데이터포털 API                                        │
│  • 자치구 API                                               │
│  • 기관 API                                                 │
│  • 기관 공개 홈페이지                                       │
└─────────────────────────────────────────────────────────────┘
```

## Backend 모듈 구조

```
src/
├── auth/                   # 인증 모듈
│   ├── strategies/         # OAuth 전략
│   ├── guards/            # 인증 가드
│   ├── controllers/       # 인증 컨트롤러
│   └── services/          # 인증 서비스
├── users/                  # 사용자 모듈
│   ├── entities/           # 사용자 엔티티
│   ├── controllers/       # 사용자 컨트롤러
│   └── services/          # 사용자 서비스
├── relationships/          # 가족 관계 모듈
│   ├── entities/           # 관계 엔티티
│   ├── controllers/       # 관계 컨트롤러
│   └── services/          # 관계 서비스
├── organizations/          # 기관 모듈
│   ├── entities/           # 기관 엔티티
│   ├── controllers/       # 기관 컨트롤러
│   └── services/          # 기관 서비스
├── contents/               # 콘텐츠 모듈
│   ├── entities/           # 콘텐츠 엔티티
│   ├── controllers/       # 콘텐츠 컨트롤러
│   └── services/          # 콘텐츠 서비스
├── data-sources/           # 데이터 소스 모듈
│   ├── adapters/          # 데이터 소스 어댑터
│   ├── collectors/        # 데이터 수집기
│   ├── schedulers/        # 스케줄러
│   └── services/          # 데이터 소스 서비스
├── recommendations/        # 추천 모듈
│   ├── services/          # 추천 서비스
│   └── strategies/        # 추천 전략
├── notifications/          # 알림 모듈
│   ├── entities/           # 알림 엔티티
│   ├── controllers/       # 알림 컨트롤러
│   ├── services/          # 알림 서비스
│   └── workers/           # 알림 워커
├── devices/                # 기기 모듈
│   ├── entities/           # 기기 엔티티
│   └── services/          # 기기 서비스
├── family/                 # 가족 모듈
│   ├── controllers/       # 가족 컨트롤러
│   └── services/          # 가족 서비스
├── admin/                  # 관리자 모듈
│   ├── controllers/       # 관리자 컨트롤러
│   └── services/          # 관리자 서비스
└── common/                 # 공통 모듈
    ├── decorators/        # 데코레이터
    ├── filters/           # 필터
    ├── interceptors/      # 인터셉터
    ├── pipes/             # 파이프
    ├── guards/            # 가드
    └── dto/               # DTO
```

## 데이터 흐름

### 1. 데이터 수집 흐름
```
External API
    ↓
Data Collector (Scheduler)
    ↓
DataSourceAdapter (정규화)
    ↓
PostgreSQL (Upsert)
    ↓
서비스 API
    ↓
Frontend
```

### 2. 인증 흐름
```
사용자
    ↓
SNS 로그인 (카카오/네이버/Google)
    ↓
OAuth 인증
    ↓
Backend Callback
    ↓
SNS 사용자 식별
    ↓
기존 사용자 확인 (없으면 생성)
    ↓
우리 서비스 Access Token + Refresh Token
    ↓
자동 로그인
```

### 3. 추천 흐름
```
사용자 정보 (지역, 연령, 관심분야, 연결기관)
    ↓
추천 서비스 (규칙 기반)
    ↓
콘텐츠 필터링 & 점수 계산
    ↓
상위 콘텐츠 반환
    ↓
"이런 거 어때요?" 표시
```

### 4. 알림 흐름
```
새로운 콘텐츠 / 추천 / 마감 임박
    ↓
Notification Worker
    ↓
Web Push 발송
    ↓
사용자 기기
    ↓
알림 표시
```

## 모듈 분리 원칙

### 초기: Modular Monolith
- 단일 NestJS 애플리케이션
- 모듈 간 명확한 경계
- 인터페이스 기반 통신

### 향후: Microservice로 분리 가능
- Data Collection Worker
- Recommendation Service
- Notification Worker
- 각 모듈은 독립적으로 확장 가능

## 기술 스택

### Backend
- **Node.js**: 런타임
- **TypeScript**: 타입 안전성
- **NestJS**: 프레임워크
- **PostgreSQL**: 주 데이터베이스
- **Redis**: 캐시, 세션, 큐
- **TypeORM**: ORM

### Frontend
- **Vue 3**: 프레임워크
- **Nuxt**: 메타 프레임워크
- **PWA**: 웹 앱

### 인프라
- **Docker**: 컨테이너화
- **Nginx**: 리버스 프록시

## 보안 아키텍처

### 인증
- SNS OAuth (카카오, 네이버, Google)
- JWT (Access Token + Refresh Token)
- HttpOnly + Secure Cookie (Refresh Token)
- PKCE
- OAuth State 검증

### 권한
- RBAC (Role-Based Access Control)
- Permission Check (가족 기능)
- 명시적 권한 부여

### 보안 조치
- HTTPS
- CORS
- Rate Limiting
- Input Validation
- SQL Injection 방어
- XSS 방어
- CSRF 방어
- Audit Log

## 확장성 고려사항

### 데이터 소스 확장
- DataSourceAdapter 인터페이스
- 새로운 데이터 소스 추가 시 기존 로직 수정 최소화

### 추천 시스템 확장
- 규칙 기반 → AI/ML 모델로 교체 가능
- 사용자 행동 데이터 기반 고도화

### 인증 확장
- 새로운 SNS Provider 추가 가능
- SocialAuthProvider 추상화

## 장애 대응

### 외부 API 장애
- 기존 수집된 데이터로 서비스 동작
- 재시도 로직
- 에러 로깅 및 모니터링

### Redis 장애
- PostgreSQL을 Source of Truth로 사용
- Redis 장애 시 핵심 서비스 동작

### Database 장애
- 연결 풀 관리
- 재시도 로직
- 백업 및 복구 전략
