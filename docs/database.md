# Database Schema

## 개요
PostgreSQL을 Source of Truth로 사용하며, 모든 데이터 모델은 확장 가능하도록 설계합니다.

## 테이블 목록

### 1. users
사용자 기본 정보를 저장합니다.

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100),
    birth_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### 2. user_social_accounts
사용자의 SNS 계정 정보를 저장합니다.

```sql
CREATE TABLE user_social_accounts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    provider VARCHAR(20) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    profile_name VARCHAR(100),
    profile_image TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (user_id) REFERENCES users(id),

    CONSTRAINT uq_social_provider_user
    UNIQUE (provider, provider_user_id)
);

CREATE INDEX idx_social_accounts_user ON user_social_accounts(user_id);
```

### 3. organizations
지역 기관 정보를 저장합니다.

```sql
CREATE TABLE organizations (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(30) NOT NULL,
    name VARCHAR(200) NOT NULL,
    address TEXT,
    phone VARCHAR(30),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 기관 유형 enum
-- APARTMENT, RESIDENT_CENTER, SENIOR_CENTER, WELFARE_CENTER,
-- LIBRARY, CULTURE_CENTER, FACILITY, ETC

CREATE INDEX idx_organizations_type ON organizations(type);
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_organizations_location ON organizations(latitude, longitude);
```

### 4. user_organizations
사용자와 기관의 연결 관계를 저장합니다.

```sql
CREATE TABLE user_organizations (
    user_id BIGINT NOT NULL,
    organization_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    disconnected_at TIMESTAMPTZ,

    PRIMARY KEY (user_id, organization_id),

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE INDEX idx_user_organizations_org ON user_organizations(organization_id);
CREATE INDEX idx_user_organizations_status ON user_organizations(status);
```

### 5. contents
외부 데이터 소스에서 수집한 콘텐츠를 통합 모델로 저장합니다.

```sql
CREATE TABLE contents (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(100),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    location TEXT,
    target VARCHAR(100),
    capacity INTEGER,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    application_start_at TIMESTAMPTZ,
    application_end_at TIMESTAMPTZ,
    source_type VARCHAR(50) NOT NULL,
    source_id VARCHAR(255) NOT NULL,
    source_url TEXT,
    raw_data JSONB,
    collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (organization_id) REFERENCES organizations(id),

    CONSTRAINT uq_content_source
    UNIQUE (source_type, source_id)
);

-- 콘텐츠 유형 enum
-- NOTICE, EVENT, PROGRAM, PERFORMANCE, EXHIBITION,
// EDUCATION, WELFARE, SPORTS, ETC

CREATE INDEX idx_contents_type ON contents(type);
CREATE INDEX idx_contents_category ON contents(category);
CREATE INDEX idx_contents_start_at ON contents(start_at);
CREATE INDEX idx_contents_end_at ON contents(end_at);
CREATE INDEX idx_contents_application_end_at ON contents(application_end_at);
CREATE INDEX idx_contents_organization ON contents(organization_id);
CREATE INDEX idx_contents_source ON contents(source_type, source_id);
```

### 6. data_sources
외부 데이터 소스의 이용조건을 관리합니다.

```sql
CREATE TABLE data_sources (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    provider VARCHAR(100),
    api_url TEXT,
    license TEXT,
    commercial_use BOOLEAN,
    redistribution_allowed BOOLEAN,
    attribution_required BOOLEAN,
    source_url TEXT,
    last_synced_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_data_sources_status ON data_sources(status);
```

### 7. user_interests
사용자의 관심 분야를 저장합니다.

```sql
CREATE TABLE user_interests (
    user_id BIGINT NOT NULL,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (user_id, category),

    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 관심 분야 enum
-- 건강, 문화, 교육, 운동, 복지, 취미, 공연, 전시, 도서, 지역행사
```

### 8. user_profiles
사용자의 추가 프로필 정보를 저장합니다.

```sql
CREATE TABLE user_profiles (
    user_id BIGINT PRIMARY KEY,
    region VARCHAR(100),
    district VARCHAR(100),
    phone VARCHAR(30),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 9. push_subscriptions
Web Push 구독 정보를 저장합니다.

```sql
CREATE TABLE push_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    device_uuid VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_device ON push_subscriptions(device_uuid);
CREATE INDEX idx_push_subscriptions_status ON push_subscriptions(status);
```

### 10. notifications
알림 정보를 저장합니다.

```sql
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    organization_id BIGINT,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(300) NOT NULL,
    body TEXT NOT NULL,
    reference_type VARCHAR(50),
    reference_id BIGINT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- 알림 유형 enum
// NEW_CONTENT, RECOMMENDATION, DEADLINE_APPROACHING, etc.

CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read_at);
CREATE INDEX idx_notifications_reference ON notifications(reference_type, reference_id);
```

### 11. user_relationships
사용자 간의 관계를 저장합니다.

```sql
CREATE TABLE user_relationships (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    target_user_id BIGINT NOT NULL,
    relationship_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ,

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (target_user_id) REFERENCES users(id),

    CONSTRAINT uq_user_relationship
    UNIQUE (user_id, target_user_id)
);

-- 관계 유형 enum
// PARENT, CHILD, SPOUSE, SIBLING, etc.

-- 상태 enum
// PENDING, APPROVED, REJECTED, BLOCKED

CREATE INDEX idx_relationships_user ON user_relationships(user_id);
CREATE INDEX idx_relationships_target ON user_relationships(target_user_id);
CREATE INDEX idx_relationships_status ON user_relationships(status);
```

### 12. user_permissions
가족 간의 권한을 저장합니다.

```sql
CREATE TABLE user_permissions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    target_user_id BIGINT NOT NULL,
    permission VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (target_user_id) REFERENCES users(id),

    CONSTRAINT uq_user_permission
    UNIQUE (user_id, target_user_id, permission)
);

-- 권한 enum
// ORGANIZATION_CONNECT, NOTIFICATION_SETTING, PROFILE_SETTING, EVENT_APPLY

CREATE INDEX idx_permissions_user ON user_permissions(user_id);
CREATE INDEX idx_permissions_target ON user_permissions(target_user_id);
```

### 13. notification_settings
사용자의 알림 설정을 저장합니다.

```sql
CREATE TABLE notification_settings (
    user_id BIGINT PRIMARY KEY,
    new_content_enabled BOOLEAN NOT NULL DEFAULT true,
    recommendation_enabled BOOLEAN NOT NULL DEFAULT true,
    deadline_alert_enabled BOOLEAN NOT NULL DEFAULT true,
    recommendation_frequency VARCHAR(20) NOT NULL DEFAULT 'DAILY',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 추천 빈도 enum
// DAILY, WEEKLY, NEVER
```

### 14. refresh_tokens
Refresh Token을 저장합니다.

```sql
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,

    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);
```

## 관계 다이어그램

```
users (1) ----< (N) user_social_accounts
users (1) ----< (N) user_organizations ----> (N) organizations
users (1) ----< (N) user_interests
users (1) ----< (1) user_profiles
users (1) ----< (N) push_subscriptions
users (1) ----< (N) notifications ----> (1) organizations
users (1) ----< (N) user_relationships ----> (1) users (target)
users (1) ----< (N) user_permissions ----> (1) users (target)
users (1) ----< (1) notification_settings
users (1) ----< (N) refresh_tokens

organizations (1) ----< (N) contents
organizations (1) ----< (N) user_organizations ----> (N) users
organizations (1) ----< (N) notifications ----> (N) users

data_sources (1) ----< (N) contents
```

## Migration 전략

TypeORM Migration을 사용하여 데이터베이스 스키마를 버전 관리합니다.

```bash
# Migration 생성
npm run migration:generate -- -n migration_name

# Migration 실행
npm run migration:run

# Migration 롤백
npm run migration:revert
```

## 데이터 정규화 규칙

### 1. 외부 데이터 중복 방지
- `source_type` + `source_id` 조합으로 Unique 제약조건
- 동일한 데이터는 upsert로 처리

### 2. 날짜 표준화
- 모든 날짜는 TIMESTAMPTZ로 저장
- 외부 API의 다양한 날짜 형식을 ISO 8601로 변환

### 3. 위치 정보 표준화
- 위도/경도는 NUMERIC(10, 7)로 저장
- 주소는 표준화된 형식으로 저장

### 4. 공백 및 특수문자 처리
- 텍스트 필드의 선행/후행 공백 제거
- 특수문자는 필요한 경우에만 허용

## 인덱스 전략

### 1. 자주 조회하는 컬럼
- foreign key 컬럼
- status 컬럼
- 날짜 컬럼 (created_at, start_at, end_at 등)

### 2. 복합 인덱스
- user_id + created_at (notifications)
- source_type + source_id (contents)
- user_id + category (user_interests)

### 3. 부분 인덱스
- status = 'ACTIVE'인 데이터만 인덱싱 (필요한 경우)

## 데이터 무결성

### 1. Foreign Key 제약
- 모든 관계는 외래키로 명시
- CASCADE DELETE는 사용하지 않음 (소프트 삭제 사용)

### 2. Unique 제약
- SNS 계정: (provider, provider_user_id)
- 콘텐츠: (source_type, source_id)
- 사용자 관계: (user_id, target_user_id)
- 권한: (user_id, target_user_id, permission)

### 3. Not Null 제약
- 필수 필드에 NOT NULL 적용
- 기본값 설정 (status, created_at, updated_at)

## 소프트 삭제

중요한 데이터는 소프트 삭제를 사용합니다.

```sql
-- users, organizations 등에서 사용
UPDATE users SET status = 'DELETED' WHERE id = ?;
```

삭제된 데이터는 status로 관리하며, 필요한 경우 복구 가능합니다.
