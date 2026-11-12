# IEUM 시스템 다이어그램 및 사용자 시나리오 검토

> 최종 갱신: B2B2C 예약 플랫폼 + 게시판 전체 보기 + 무한스크롤 반영 기준

## 1. 전체 시스템 구성

```mermaid
flowchart TB
    subgraph Client["클라이언드 (PWA)"]
        FE["Nuxt 3 + Vue 3 + Tailwind<br/>GitHub Pages<br/>https://downtime00.github.io/ieum/"]
        SW["Service Worker<br/>(오프라인 캐시, 푸시)"]
    end

    subgraph Backend["백엔드 (Koyeb)"]
        API["NestJS REST API<br/>JWT 인증 + Zod 검증 + Throttler"]
        subgraph Modules["도메인 모듈"]
            AUTH["Auth/Users<br/>이메일·소셜 로그인, JWT+Refresh"]
            CONT["Contents<br/>문화정보·이벤트·날씨·교통"]
            BOARD["Board/Family<br/>가족·그룹·게시판·댓글"]
            MED["Medications<br/>복약·알림"]
            NOTI["Notifications<br/>알림함 + Web Push (VAPID)"]
            LOC["Location<br/>위치/수동 지역검색"]
            OPS["Operators<br/>공영자·프로그램·예약·정산·후기"]
            ADMIN["Admin<br/>공지·로그·활동"]
        end
    end

    subgraph Data["데이터 계층"]
        PG[("PostgreSQL<br/>(Supabase)")]
        RD[("Redis<br/>(세션/캐시)")]
    end

    subgraph External["외부 서비스"]
        NAVER["네이버 지도/지역검색"]
        CULT["문화정보 API (culture.go.kr 등)"]
        OSM["OSM Nominatim (폴백)"]
    end

    FE --> SW
    FE -->|HTTPS REST| API
    API --> PG
    API --> RD
    API --> NAVER
    API --> CULT
    API --> OSM
    NOTI -->|Web Push| SW
```

## 2. 도메인 모듈 맵

| 영역 | 모듈 | 주요 테이블 |
|---|---|---|
| 인증/사용자 | auth, users | users, user_profiles, refresh_tokens |
| 생활정보 | contents, events, location, data-collector | contents, events, event_participations |
| 가족/그룹 | family, board | families, family_members, family_invite_codes, family_posts, family_post_comments |
| 복지 알림 | medications, notifications | medications, notifications, push_subscriptions |
| **B2B2C 마켓** | **operators** | operators, operator_programs, program_bookings, operator_reviews |
| 운영 | admin, logs | notices, admin_activities, logs |

## 3. B2B2C 예약·정산 상태머신

```mermaid
stateDiagram-v2
    [*] --> REQUESTED: 이용자 예약 신청
    REQUESTED --> ACCEPTED: 공영자 수락
    REQUESTED --> REJECTED: 공영자 거절
    ACCEPTED --> PAID: 이용자 입금 신고
    ACCEPTED --> CANCELLED: 취소
    PAID --> COMPLETED: 공영자 "운영 완료"
    PAID --> REFUNDED: 환불
    COMPLETED --> SETTLED: 이용자 "확인" → 정산 완료
    COMPLETED --> REFUNDED: 환불
    SETTLED --> [*]: 후기 작성 가능 (예약당 1회)
```

금액 계산 (예약 시점 스냅샷): `platformFee = total × feeRate(기본 10%)`, `settlement = total − fee`

예약 분기 규칙:
- 개인 예약(공연·강의·체험): 누구나
- 그룹 예약(`familyId` 지정): **HEAD(그룹장)만**
- 요양·간병/방문서비스: **가족 지정 필수 + HEAD만** + 희망 장소(주소/좌표) 필수

## 4. 액터별 시나리오

### 4.1 일반 사용자 (어르신/이용자)

```mermaid
sequenceDiagram
    participant U as 이용자
    participant FE as 프론트엔드
    participant API as 백엔드
    participant DB as PostgreSQL

    U->>FE: 회원가입/로그인
    FE->>API: POST /auth/register|login → JWT+Refresh
    U->>FE: 위치 설정 (GPS 또는 동네 검색)
    FE->>API: GET /contents (거리순 문화정보)
    U->>FE: 게시판 → "전체" 칩
    FE->>API: GET /board/posts/all (20개씩 무한스크롤)
    U->>FE: 프로그램 상세 → 예약 신청
    FE->>API: POST /bookings (희망장소 선택 가능)
    U->>FE: 내 예약 → 입금 신고 → 완료 확인 → 정산
    U->>FE: 후기 작성 (SETTLED 후, 별점+코멘트)
```

**주요 기능**: 문화정보/이벤트 탐색, 복약·메모 알림, 날씨/대중교통, 가족·그룹 게시판(전체 보기), 프로그램 예약·입금·확인·후기, 공지 수신.

### 4.2 그룹장 (가족/그룹 관리자)

```mermaid
sequenceDiagram
    participant H as 그룹장
    participant API as 백엔드
    participant M as 구성원

    H->>API: 가족/그룹 생성 → 초대코드 발급
    M->>API: 초대코드/QR로 가입 (MEMBER)
    H->>API: 그룹 게시판 글쓰기/공지/댓글 on-off
    H->>API: 그룹 예약 신청 (HEAD 권한)
    H->>API: 요양·간병/방문서비스 예약 (가족 필수)
    Note over H,API: 예약 수락 후 → 구성원 공지 선택 발송
    H->>API: POST /bookings/:id/notice (전체 또는 선택 멤버)
    API->>M: 알림 + 웹푸시 (계정 있는 멤버만)
```

### 4.3 공영자 / 요양보호사 / 간병인 (서비스 제공자)

```mermaid
sequenceDiagram
    participant O as 제공자
    participant API as 백엔드
    participant U as 이용자

    O->>API: 기관 등록 (기관/요양보호사/간병인 유형)
    Note over API: 관리자 승인 필요 (PENDING→APPROVED)
    O->>API: 프로그램/서비스 등록 (일시·시간·가격·정원·분류)
    U->>API: 예약 신청 (REQUESTED)
    O->>API: 수락(ACCEPTED) / 거절(REJECTED)
    U->>API: 입금 신고 (PAID) — 수동 계좌이체
    O->>API: 운영 완료 처리 (COMPLETED)
    U->>API: 이용 확인 → 정산 완료 (SETTLED)
    O->>API: GET /operators/:id/history (공연 이력)
    U->>API: 후기 작성 → 기관 평균 평점 반영
```

## 5. 시나리오 검토 — 갭 및 리스크

### 정상 동작 확인됨 (로컬 E2E)
- 기관 등록→승인→프로그램 등록→예약→수락→입금→완료→확인→정산→후기→평점 집계
- 그룹 권한(HEAD 전용), 요양 예약 필수조건, 구성원 공지, 전체 보기 페이징

### ⚠️ 발견된 갭 (우선순위 순)

| # | 항목 | 현황 | 권장 조치 |
|---|---|---|---|
| 1 | **인증 부재 엔드포인트** | ✅ operators 모듈은 `UserAuthGuard`(Bearer JWT + userId 일치 검증) 적용 완료. 프론트는 fetch 래퍼로 헤더 자동 첨부. **board/기타 모듈은 여전히 `?userId=` 신뢰** | board·medications·notifications 등 나머지 모듈에도 동일 가드 단계적 적용 |
| 2 | **실결제 미구현** | 수동 입금 신고만. 플랫폼 수수료는 상태값일 뿐 실제 에스크로 아님 | PG 연동(토스페이먼츠 등) + 정산 자동화 |
| 3 | **정원 초과 가능** | ✅ REQUESTED/ACCEPTED/PAID 인원을 좌석 홀드로 계산, 신청·수락 시 정원 검증 추가 | 프로그램 잔여석 표시도 홀드 반영 검토 |
| 4 | **기관 승인 무방어** | ✅ `AdminAuthGuard` — ADMIN/SUPER_ADMIN role만 승인/반려 가능 | 관리자 승인 UI 추가 |
| 5 | **프로덕션 마이그레이션** | ✅ `src/migrations/create-operators-tables.ts` 작성 (operators/operator_programs/program_bookings/operator_reviews) | typeorm CLI 연결 또는 SQL 수동 실행 필요 |
| 6 | **웹푸시 키 미설정** | Koyeb에 `VAPID_PUBLIC_KEY/PRIVATE_KEY` 없으면 푸시 발송 불가 | env 등록 필요 |
| 7 | **미등록 모듈** | ✅ AudioStreamModule 등록 + `AudioPlayerService` InjectRepository 누락 수정. ⚠️ RecommendationModule은 `Content` 엔티티가 contents/users 두 군데 중복 정의라 보류 (프론트 미사용) | 레거시 엔티티 통합 후 재등록 |
| 8 | **앱 미사용 멤버** | `userId=null` 구성원은 알림/푸시 수신 불가 (의도된 동작) | 대체 채널(문자/전화) 검토 |
| 9 | **전체 보기 상한** | posts/all은 최대 1000건 스캔 후 20개씩 페이징 | 데이터 증가 시 커서 기반 페이지네이션 권장 |
| 10 | **i18n 미적용 페이지** | operators/bookings 등 신규 B2B 화면은 한국어 하드코딩 | 다국어 확장 시 점진적 적용 |

## 6. 배포 구성

| 구성요소 | 위치 | 비고 |
|---|---|---|
| 프론트엔드 | GitHub Pages (`frontend` 브랜치) | baseURL `/ieum/`, PWA |
| 백엔드 | Koyeb (`main` 브랜치) | env: DATABASE_URL, JWT_SECRET, ALLOWED_ORIGINS, VAPID_* |
| DB/캐시 | Supabase PostgreSQL + Redis | ssl 연결 |
