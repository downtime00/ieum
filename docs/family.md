# Family

## 개요
자녀가 부모님의 계정 설정을 도울 수 있는 가족 기능입니다. 계정을 공유하지 않고 명시적 권한 부여를 통해 부모님의 서비스 이용을 지원합니다.

## 핵심 원칙

### 1. 계정 공유 금지
- 자녀와 부모님은 별도의 계정 사용
- 계정 연결을 통해 관계 형성

### 2. 명시적 권한 부여
- 모든 작업은 명시적 권한 확인 필요
- 권한별 세분화된 제어

### 3. 동의 필수
- 부모님의 명시적 동의 필요
- 연결 요청/수락 프로세스

## 관계 유형

```typescript
enum RelationshipType {
  PARENT = 'PARENT',        // 부모
  CHILD = 'CHILD',          // 자녀
  SPOUSE = 'SPOUSE',        // 배우자
  SIBLING = 'SIBLING',      // 형제자매
  ETC = 'ETC',              // 기타
}

enum RelationshipStatus {
  PENDING = 'PENDING',      // 대기 중
  APPROVED = 'APPROVED',    // 승인됨
  REJECTED = 'REJECTED',    // 거절됨
  BLOCKED = 'BLOCKED',      // 차단됨
}
```

## 권한 유형

```typescript
enum Permission {
  ORGANIZATION_CONNECT = 'ORGANIZATION_CONNECT',      // 기관 연결
  NOTIFICATION_SETTING = 'NOTIFICATION_SETTING',    // 알림 설정
  PROFILE_SETTING = 'PROFILE_SETTING',              // 프로필 설정
  EVENT_APPLY = 'EVENT_APPLY',                        // 이벤트 신청
}
```

## DB 스키마

### user_relationships

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

CREATE INDEX idx_relationships_user ON user_relationships(user_id);
CREATE INDEX idx_relationships_target ON user_relationships(target_user_id);
CREATE INDEX idx_relationships_status ON user_relationships(status);
```

### user_permissions

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

CREATE INDEX idx_permissions_user ON user_permissions(user_id);
CREATE INDEX idx_permissions_target ON user_permissions(target_user_id);
```

## 연결 흐름

```
자녀 계정
    ↓
가족 연결 요청 (부모님 전화번호 또는 SNS 연결)
    ↓
부모님 계정에서 요청 확인
    ↓
부모님 본인 SNS 로그인 (보안)
    ↓
연결 수락
    ↓
관계 생성 (PENDING → APPROVED)
    ↓
권한 부여 (자녀가 요청한 권한)
    ↓
자녀가 부모님 계정 관리 가능
```

## Family Service

### 연결 요청

```typescript
class FamilyService {
  async sendInvitation(
    requesterId: number,
    targetUserId: number,
    relationshipType: RelationshipType,
    requestedPermissions: Permission[],
  ): Promise<UserRelationship> {
    // 기존 관계 확인
    const existing = await this.relationshipRepository.findOne({
      where: {
        userId: requesterId,
        targetUserId,
      },
    });

    if (existing) {
      throw new ConflictException('이미 존재하는 관계입니다.');
    }

    // 연결 요청 생성
    const relationship = this.relationshipRepository.create({
      userId: requesterId,
      targetUserId,
      relationshipType,
      status: RelationshipStatus.PENDING,
    });

    await this.relationshipRepository.save(relationship);

    // 요청된 권한 저장
    for (const permission of requestedPermissions) {
      await this.permissionRepository.save({
        userId: requesterId,
        targetUserId,
        permission,
      });
    }

    // 알림 발송
    await this.notificationService.createNotification(targetUserId, {
      type: 'FAMILY_INVITATION',
      title: '가족 연결 요청',
      body: '가족 연결 요청이 도착했습니다.',
      referenceType: 'RELATIONSHIP',
      referenceId: relationship.id,
    });

    return relationship;
  }
}
```

### 연결 수락

```typescript
async acceptInvitation(
  targetUserId: number,
  relationshipId: number,
): Promise<UserRelationship> {
  const relationship = await this.relationshipRepository.findOne({
    where: { id: relationshipId, targetUserId },
  });

  if (!relationship) {
    throw new NotFoundException('요청을 찾을 수 없습니다.');
  }

  if (relationship.status !== RelationshipStatus.PENDING) {
    throw new BadRequestException('이미 처리된 요청입니다.');
  }

  // 본인 인증 (SNS 재로그인 필요)
  await this.verifyIdentity(targetUserId);

  // 관계 승인
  relationship.status = RelationshipStatus.APPROVED;
  relationship.approvedAt = new Date();

  await this.relationshipRepository.save(relationship);

  // 알림 발송
  await this.notificationService.createNotification(relationship.userId, {
    type: 'FAMILY_ACCEPTED',
    title: '가족 연결 완료',
    body: '가족 연결이 승인되었습니다.',
    referenceType: 'RELATIONSHIP',
    referenceId: relationship.id,
  });

  return relationship;
}

private async verifyIdentity(userId: number): Promise<void> {
  // SNS 재로그인을 통한 본인 인증
  // 세션 또는 추가 인증 단계 필요
}
```

### 연결 거절

```typescript
async rejectInvitation(
  targetUserId: number,
  relationshipId: number,
): Promise<void> {
  const relationship = await this.relationshipRepository.findOne({
    where: { id: relationshipId, targetUserId },
  });

  if (!relationship) {
    throw new NotFoundException('요청을 찾을 수 없습니다.');
  }

  relationship.status = RelationshipStatus.REJECTED;
  await this.relationshipRepository.save(relationship);

  // 권한 삭제
  await this.permissionRepository.delete({
    userId: relationship.userId,
    targetUserId,
  });

  // 알림 발송
  await this.notificationService.createNotification(relationship.userId, {
    type: 'FAMILY_REJECTED',
    title: '가족 연결 거절',
    body: '가족 연결 요청이 거절되었습니다.',
    referenceType: 'RELATIONSHIP',
    referenceId: relationship.id,
  });
}
```

## 권한 확인

### Permission Guard

```typescript
@Injectable()
class FamilyPermissionGuard implements CanActivate {
  constructor(
    private readonly familyService: FamilyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user.id;
    const targetUserId = request.params.userId || request.body.targetUserId;
    const requiredPermission = request.requiredPermission;

    // 본인인 경우 항상 허용
    if (userId === targetUserId) {
      return true;
    }

    // 권한 확인
    const hasPermission = await this.familyService.hasPermission(
      userId,
      targetUserId,
      requiredPermission,
    );

    if (!hasPermission) {
      throw new ForbiddenException('권한이 없습니다.');
    }

    return true;
  }
}
```

### 권한 확인 서비스

```typescript
class FamilyService {
  async hasPermission(
    userId: number,
    targetUserId: number,
    permission: Permission,
  ): Promise<boolean> {
    // 관계 확인
    const relationship = await this.relationshipRepository.findOne({
      where: {
        userId,
        targetUserId,
        status: RelationshipStatus.APPROVED,
      },
    });

    if (!relationship) {
      return false;
    }

    // 권한 확인
    const userPermission = await this.permissionRepository.findOne({
      where: {
        userId,
        targetUserId,
        permission,
      },
    });

    return !!userPermission;
  }

  async grantPermission(
    userId: number,
    targetUserId: number,
    permission: Permission,
  ): Promise<void> {
    // 기존 권한 확인
    const existing = await this.permissionRepository.findOne({
      where: { userId, targetUserId, permission },
    });

    if (!existing) {
      await this.permissionRepository.save({
        userId,
        targetUserId,
        permission,
      });
    }
  }

  async revokePermission(
    userId: number,
    targetUserId: number,
    permission: Permission,
  ): Promise<void> {
    await this.permissionRepository.delete({
      userId,
      targetUserId,
      permission,
    });
  }
}
```

## 부모님 기관 설정

### 기관 연결

```typescript
class FamilyService {
  @UseGuards(FamilyPermissionGuard)
  async connectOrganizationForUser(
    requesterId: number,
    targetUserId: number,
    organizationId: number,
  ): Promise<void> {
    // 권한 확인 (Guard에서 처리)
    // ORGANIZATION_CONNECT 권한 필요

    // 기관 연결
    const existing = await this.userOrganizationRepository.findOne({
      where: {
        userId: targetUserId,
        organizationId,
      },
    });

    if (!existing) {
      await this.userOrganizationRepository.save({
        userId: targetUserId,
        organizationId,
        status: 'ACTIVE',
        connectedAt: new Date(),
      });
    }

    // 알림 발송
    await this.notificationService.createNotification(targetUserId, {
      type: 'ORGANIZATION_CONNECTED',
      title: '기관 연결',
      body: '자녀가 기관을 연결했습니다.',
      referenceType: 'ORGANIZATION',
      referenceId: organizationId,
    });
  }
}
```

### 기관 연결 해제

```typescript
@UseGuards(FamilyPermissionGuard)
async disconnectOrganizationForUser(
  requesterId: number,
  targetUserId: number,
  organizationId: number,
): Promise<void> {
  // 권한 확인 (Guard에서 처리)

  await this.userOrganizationRepository.update(
    {
      userId: targetUserId,
      organizationId,
    },
    {
      status: 'INACTIVE',
      disconnectedAt: new Date(),
    },
  );

  // 알림 발송
  await this.notificationService.createNotification(targetUserId, {
    type: 'ORGANIZATION_DISCONNECTED',
    title: '기관 연결 해제',
    body: '자녀가 기관 연결을 해제했습니다.',
    referenceType: 'ORGANIZATION',
    referenceId: organizationId,
  });
}
```

## 부모님 관심분야 설정

```typescript
@UseGuards(FamilyPermissionGuard)
async setInterestsForUser(
  requesterId: number,
  targetUserId: number,
  interests: string[],
): Promise<void> {
  // 권한 확인 (Guard에서 처리)
  // PROFILE_SETTING 권한 필요

  // 기존 관심분야 삭제
  await this.userInterestRepository.delete({ userId: targetUserId });

  // 새로운 관심분야 추가
  for (const interest of interests) {
    await this.userInterestRepository.save({
      userId: targetUserId,
      category: interest,
    });
  }

  // 추천 캐시 무효화
  await this.recommendationService.invalidateRecommendations(targetUserId);

  // 알림 발송
  await this.notificationService.createNotification(targetUserId, {
    type: 'INTERESTS_UPDATED',
    title: '관심분야 설정',
    body: '자녀가 관심분야를 설정했습니다.',
  });
}
```

## API

### GET /family
가족 목록 조회

### POST /family/invitations
가족 연결 요청

```json
{
  "target_user_id": 2,
  "relationship_type": "CHILD",
  "requested_permissions": ["ORGANIZATION_CONNECT", "NOTIFICATION_SETTING"]
}
```

### POST /family/invitations/:id/accept
가족 연결 요청 수락

### POST /family/invitations/:id/reject
가족 연결 요청 거절

### GET /family/:userId/organizations
가족 기관 목록 조회

### POST /family/:userId/organizations/:organizationId/connect
가족 기관 연결

### DELETE /family/:userId/organizations/:organizationId/connect
가족 기관 연결 해제

### POST /family/:userId/interests
가족 관심분야 설정

```json
{
  "interests": ["건강", "문화", "교육"]
}
```

### GET /family/:userId/permissions
가족 권한 목록 조회

### POST /family/:userId/permissions
가족 권한 부여

```json
{
  "permission": "ORGANIZATION_CONNECT"
}
```

### DELETE /family/:userId/permissions/:permission
가족 권한 회수

## 보안

### 1. 본인 인증
- 연결 수락 시 SNS 재로그인 필수
- 중요 작업 시 추가 인증

### 2. 권한 확인
- 모든 작업 전 명시적 권한 확인
- Permission Guard 사용

### 3. 감사 로그
- 모든 가족 작업 로깅
- 누가 무엇을 언제 했는지 기록

```typescript
class AuditService {
  async logFamilyAction(
    userId: number,
    targetUserId: number,
    action: string,
    details: any,
  ): Promise<void> {
    await this.auditLogRepository.save({
      userId,
      targetUserId,
      action,
      details,
      timestamp: new Date(),
    });
  }
}
```

### 4. 연결 제한
- 최대 연결 수 제한 (예: 5명)
- 의심스러운 활동 감지

## UX 고려사항

### 자녀 화면
- 부모님 계정 관리 화면
- 명확한 권한 표시
- 쉬운 기관 연결
- 직관적인 관심분야 설정

### 부모님 화면
- 연결 요청 알림
- 권한 확인 화면
- 수락/거절 버튼
- 본인 인증 프로세스

### 알림
- 모든 작업에 알림 발송
- 명확한 작업 내용 표시
- 누가 무엇을 했는지 명시

## 에러 처리

| 에러 | 설명 |
|-----|------|
| RELATIONSHIP_EXISTS | 이미 존재하는 관계 |
| RELATIONSHIP_NOT_FOUND | 관계를 찾을 수 없음 |
| PERMISSION_DENIED | 권한 없음 |
| INVALID_RELATIONSHIP_TYPE | 잘못된 관계 유형 |
| ALREADY_PROCESSED | 이미 처리된 요청 |
| MAX_CONNECTIONS_EXCEEDED | 최대 연결 수 초과 |

## 확장성

### 향후 추가 가능 기능
- 가족 캘린더 공유
- 가족 알림 설정
- 가족 위치 공유 (선택적)
- 가족 건강 관리
- 긴급 연락망

## 요약

- 계정 공유 없는 가족 기능
- 명시적 권한 부여 시스템
- 본인 인증 필수
- 감사 로그
- 권한별 세분화된 제어
- 직관적인 UX
