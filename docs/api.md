# API Design

## 개요
RESTful API 설계 원칙을 따르며, 모든 API는 JSON 형식으로 요청/응답합니다.

## 공통 규약

### 요청 헤더
```
Content-Type: application/json
Authorization: Bearer {access_token}
```

### 응답 형식
```json
{
  "success": true,
  "data": {},
  "message": "string",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 에러 응답
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지",
    "details": {}
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### HTTP 상태 코드
- 200: 성공
- 201: 생성 성공
- 400: 잘못된 요청
- 401: 인증 실패
- 403: 권한 없음
- 404: 리소스 없음
- 409: 충돌 (중복 등)
- 429: Rate Limit 초과
- 500: 서버 에러

## API 목록

### Auth

#### 1. SNS 로그인 시작
```
GET /auth/{provider}
```

**Params:**
- provider: kakao | naver | google

**Response:**
```json
{
  "success": true,
  "data": {
    "auth_url": "https://..."
  }
}
```

#### 2. SNS 콜백
```
GET /auth/{provider}/callback
```

**Query Params:**
- code: OAuth 인증 코드
- state: CSRF 방지용 state

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "jwt_access_token",
    "refresh_token": "jwt_refresh_token",
    "user": {
      "id": 1,
      "name": "홍길동",
      "created_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### 3. 토큰 갱신
```
POST /auth/token/refresh
```

**Body:**
```json
{
  "refresh_token": "jwt_refresh_token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "new_jwt_access_token",
    "refresh_token": "new_jwt_refresh_token"
  }
}
```

#### 4. 로그아웃
```
POST /auth/logout
```

**Response:**
```json
{
  "success": true,
  "message": "로그아웃 되었습니다."
}
```

### User

#### 1. 내 정보 조회
```
GET /users/me
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "홍길동",
    "birth_date": "1960-01-01",
    "profile": {
      "region": "서울특별시",
      "district": "강남구",
      "phone": "010-1234-5678"
    },
    "interests": ["건강", "문화"],
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### 2. 내 정보 수정
```
PATCH /users/me
```

**Body:**
```json
{
  "name": "홍길동",
  "birth_date": "1960-01-01",
  "profile": {
    "region": "서울특별시",
    "district": "강남구",
    "phone": "010-1234-5678"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "홍길동",
    "birth_date": "1960-01-01",
    "profile": {
      "region": "서울특별시",
      "district": "강남구",
      "phone": "010-1234-5678"
    },
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### 3. 내 기관 목록 조회
```
GET /users/me/organizations
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "WELFARE_CENTER",
      "name": "OO복지관",
      "address": "서울특별시 강남구...",
      "phone": "02-1234-5678",
      "connected_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### 4. 관심분야 설정
```
POST /users/me/interests
```

**Body:**
```json
{
  "interests": ["건강", "문화", "교육"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "interests": ["건강", "문화", "교육"]
  }
}
```

### Organizations

#### 1. 기관 목록 조회
```
GET /organizations
```

**Query Params:**
- type: 기관 유형 (선택)
- region: 지역 (선택)
- district: 자치구 (선택)
- lat: 위도 (선택)
- lng: 경도 (선택)
- radius: 반경 km (선택, 기본값 5)
- page: 페이지 (기본값 1)
- limit: 페이지당 개수 (기본값 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "type": "WELFARE_CENTER",
        "name": "OO복지관",
        "address": "서울특별시 강남구...",
        "phone": "02-1234-5678",
        "latitude": 37.1234567,
        "longitude": 127.1234567,
        "distance": 1.5
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

#### 2. 기관 상세 조회
```
GET /organizations/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "type": "WELFARE_CENTER",
    "name": "OO복지관",
    "address": "서울특별시 강남구...",
    "phone": "02-1234-5678",
    "latitude": 37.1234567,
    "longitude": 127.1234567,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### 3. 기관 연결
```
POST /organizations/:id/connect
```

**Response:**
```json
{
  "success": true,
  "message": "기관이 연결되었습니다."
}
```

#### 4. 기관 연결 해제
```
DELETE /organizations/:id/connect
```

**Response:**
```json
{
  "success": true,
  "message": "기관 연결이 해제되었습니다."
}
```

### Contents

#### 1. 콘텐츠 목록 조회
```
GET /contents
```

**Query Params:**
- type: 콘텐츠 유형 (선택)
- category: 카테고리 (선택)
- organization_id: 기관 ID (선택)
- region: 지역 (선택)
- district: 자치구 (선택)
- target: 대상 (선택)
- start_date_from: 시작일 (선택)
- start_date_to: 종료일 (선택)
- application_available: 신청 가능 여부 (boolean, 선택)
- page: 페이지 (기본값 1)
- limit: 페이지당 개수 (기본값 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "type": "PROGRAM",
        "category": "건강",
        "title": "건강체조 프로그램",
        "description": "건강체조 프로그램입니다.",
        "location": "OO복지관 강당",
        "target": "65세 이상",
        "capacity": 30,
        "start_at": "2024-10-05T09:00:00Z",
        "end_at": "2024-12-05T18:00:00Z",
        "application_start_at": "2024-09-01T00:00:00Z",
        "application_end_at": "2024-09-30T23:59:59Z",
        "organization": {
          "id": 1,
          "name": "OO복지관",
          "type": "WELFARE_CENTER"
        },
        "source_url": "https://...",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

#### 2. 콘텐츠 상세 조회
```
GET /contents/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "type": "PROGRAM",
    "category": "건강",
    "title": "건강체조 프로그램",
    "description": "건강체조 프로그램입니다.",
    "location": "OO복지관 강당",
    "target": "65세 이상",
    "capacity": 30,
    "start_at": "2024-10-05T09:00:00Z",
    "end_at": "2024-12-05T18:00:00Z",
    "application_start_at": "2024-09-01T00:00:00Z",
    "application_end_at": "2024-09-30T23:59:59Z",
    "organization": {
      "id": 1,
      "name": "OO복지관",
      "type": "WELFARE_CENTER",
      "address": "서울특별시 강남구...",
      "phone": "02-1234-5678"
    },
    "source_type": "CULTURE_API",
    "source_url": "https://...",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Recommendations

#### 1. 추천 콘텐츠 조회
```
GET /recommendations
```

**Query Params:**
- limit: 개수 (기본값 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "PROGRAM",
      "category": "건강",
      "title": "건강체조 프로그램",
      "description": "건강체조 프로그램입니다.",
      "location": "OO복지관 강당",
      "target": "65세 이상",
      "start_at": "2024-10-05T09:00:00Z",
      "end_at": "2024-12-05T18:00:00Z",
      "application_end_at": "2024-09-30T23:59:59Z",
      "organization": {
        "id": 1,
        "name": "OO복지관",
        "type": "WELFARE_CENTER"
      },
      "recommendation_reason": "지역, 관심분야 일치",
      "score": 90,
      "source_url": "https://..."
    }
  ]
}
```

### Notifications

#### 1. 알림 목록 조회
```
GET /notifications
```

**Query Params:**
- unread_only: 읽지 않은 알림만 (boolean, 선택)
- page: 페이지 (기본값 1)
- limit: 페이지당 개수 (기본값 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "type": "RECOMMENDATION",
        "title": "✨ 이런 거 어때요?",
        "body": "회원님 주변에서 참여할 수 있는 프로그램이 있습니다.",
        "reference_type": "CONTENT",
        "reference_id": 1,
        "read_at": null,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 20
  }
}
```

#### 2. 알림 읽음 처리
```
PATCH /notifications/:id/read
```

**Response:**
```json
{
  "success": true,
  "message": "알림을 읽음 처리했습니다."
}
```

#### 3. 전체 알림 읽음 처리
```
PATCH /notifications/read-all
```

**Response:**
```json
{
  "success": true,
  "message": "모든 알림을 읽음 처리했습니다."
}
```

#### 4. 읽지 않은 알림 수 조회
```
GET /notifications/unread-count
```

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

#### 5. Web Push 구독
```
POST /notifications/subscribe
```

**Body:**
```json
{
  "endpoint": "https://...",
  "keys": {
    "p256dh": "base64...",
    "auth": "base64..."
  },
  "device_uuid": "optional-device-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "알림 구독이 완료되었습니다."
}
```

#### 6. Web Push 구독 해제
```
DELETE /notifications/subscribe
```

**Body:**
```json
{
  "endpoint": "https://..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "알림 구독이 해제되었습니다."
}
```

#### 7. 알림 설정 조회
```
GET /notifications/settings
```

**Response:**
```json
{
  "success": true,
  "data": {
    "new_content_enabled": true,
    "recommendation_enabled": true,
    "deadline_alert_enabled": true,
    "recommendation_frequency": "DAILY"
  }
}
```

#### 8. 알림 설정 수정
```
PATCH /notifications/settings
```

**Body:**
```json
{
  "new_content_enabled": true,
  "recommendation_enabled": true,
  "deadline_alert_enabled": true,
  "recommendation_frequency": "DAILY"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "new_content_enabled": true,
    "recommendation_enabled": true,
    "deadline_alert_enabled": true,
    "recommendation_frequency": "DAILY"
  }
}
```

### Family

#### 1. 가족 목록 조회
```
GET /family
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "name": "김철수",
      "relationship_type": "CHILD",
      "status": "APPROVED",
      "approved_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### 2. 가족 연결 요청
```
POST /family/invitations
```

**Body:**
```json
{
  "target_user_id": 2,
  "relationship_type": "CHILD"
}
```

**Response:**
```json
{
  "success": true,
  "message": "가족 연결 요청을 보냈습니다."
}
```

#### 3. 가족 연결 요청 수락
```
POST /family/invitations/:id/accept
```

**Response:**
```json
{
  "success": true,
  "message": "가족 연결이 완료되었습니다."
}
```

#### 4. 가족 연결 요청 거절
```
POST /family/invitations/:id/reject
```

**Response:**
```json
{
  "success": true,
  "message": "가족 연결 요청을 거절했습니다."
}
```

#### 5. 가족 기관 설정 조회
```
GET /family/:userId/organizations
```

**Params:**
- userId: 대상 사용자 ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "WELFARE_CENTER",
      "name": "OO복지관",
      "connected_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### 6. 가족 기관 연결
```
POST /family/:userId/organizations/:organizationId/connect
```

**Params:**
- userId: 대상 사용자 ID
- organizationId: 기관 ID

**Response:**
```json
{
  "success": true,
  "message": "기관이 연결되었습니다."
}
```

#### 7. 가족 기관 연결 해제
```
DELETE /family/:userId/organizations/:organizationId/connect
```

**Params:**
- userId: 대상 사용자 ID
- organizationId: 기관 ID

**Response:**
```json
{
  "success": true,
  "message": "기관 연결이 해제되었습니다."
}
```

#### 8. 가족 관심분야 설정
```
POST /family/:userId/interests
```

**Params:**
- userId: 대상 사용자 ID

**Body:**
```json
{
  "interests": ["건강", "문화"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "interests": ["건강", "문화"]
  }
}
```

## 에러 코드

| 코드 | 설명 |
|-----|------|
| AUTH_INVALID_TOKEN | 유효하지 않은 토큰 |
| AUTH_TOKEN_EXPIRED | 토큰 만료 |
| AUTH_INVALID_CREDENTIALS | 잘못된 인증 정보 |
| USER_NOT_FOUND | 사용자를 찾을 수 없음 |
| ORGANIZATION_NOT_FOUND | 기관을 찾을 수 없음 |
| CONTENT_NOT_FOUND | 콘텐츠를 찾을 수 없음 |
| DUPLICATE_ORGANIZATION | 이미 연결된 기관 |
| INVALID_REQUEST | 잘못된 요청 |
| PERMISSION_DENIED | 권한 없음 |
| RATE_LIMIT_EXCEEDED | 요청 제한 초과 |
| INTERNAL_SERVER_ERROR | 서버 에러 |

## Rate Limiting

- 일반 API: 1000 requests/hour
- 인증 API: 100 requests/hour
- 초과 시 429 응답

## CORS

허용된 도메인에서만 API 호출 가능 (환경변수로 설정)

## 보안

### 인증
- JWT 사용 (Access Token: 15분, Refresh Token: 7일)
- HttpOnly + Secure Cookie (Refresh Token)

### 권한
- RBAC 기반 권한 체크
- 가족 기능 시 명시적 권한 확인

### 입력 검증
- 모든 입력에 대한 Validation
- SQL Injection 방어
- XSS 방어
