# Recommendation

## 개요
"이런 거 어때요?" 추천 시스템으로, 사용자가 직접 검색하지 않아도 자신에게 적합한 콘텐츠를 추천합니다.

## 추천 기준

MVP에서 사용하는 추천 기준:
- 지역 일치
- 연령 일치
- 관심분야 일치
- 거리 가까움
- 신청 가능 여부
- 행사 기간
- 사용자가 연결한 기관

## 추천 알고리즘

### MVP: 규칙 기반 추천

```typescript
class RecommendationService {
  async getRecommendations(userId: number, limit: number = 10): Promise<RecommendedContent[]> {
    // 사용자 정보 조회
    const user = await this.getUserWithProfile(userId);
    const userOrganizations = await this.getUserOrganizations(userId);
    const userInterests = await this.getUserInterests(userId);

    // 후보 콘텐츠 조회
    const candidates = await this.getCandidateContents(user, userOrganizations);

    // 점수 계산
    const scored = candidates.map(content => ({
      content,
      score: this.calculateScore(content, user, userOrganizations, userInterests),
    }));

    // 상위 N개 반환
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(item => ({
      ...item.content,
      recommendationReason: this.generateReason(item.content, user),
      score: item.score,
    }));
  }

  private calculateScore(
    content: Content,
    user: User,
    userOrganizations: Organization[],
    userInterests: string[],
  ): number {
    let score = 0;

    // 지역 일치 (+40)
    if (this.isRegionMatch(content, user)) {
      score += 40;
    }

    // 관심분야 일치 (+30)
    if (this.isInterestMatch(content, userInterests)) {
      score += 30;
    }

    // 대상 연령 일치 (+20)
    if (this.isAgeMatch(content, user)) {
      score += 20;
    }

    // 거리 가까움 (+10)
    const distance = this.calculateDistance(content, user);
    if (distance < 5) {
      score += 10;
    } else if (distance < 10) {
      score += 5;
    }

    // 신청 가능 여부 (+15)
    if (this.isApplicationAvailable(content)) {
      score += 15;
    }

    // 연결된 기관 (+25)
    if (this.isConnectedOrganization(content, userOrganizations)) {
      score += 25;
    }

    // 마감 임박 (+20)
    if (this.isDeadlineApproaching(content)) {
      score += 20;
    }

    return score;
  }

  private isRegionMatch(content: Content, user: User): boolean {
    if (!user.profile?.region || !user.profile?.district) {
      return false;
    }

    const contentLocation = content.location;
    return contentLocation?.includes(user.profile.region) ||
           contentLocation?.includes(user.profile.district);
  }

  private isInterestMatch(content: Content, userInterests: string[]): boolean {
    if (!userInterests || userInterests.length === 0) {
      return false;
    }

    return userInterests.some(interest =>
      content.category?.includes(interest) ||
      content.title?.includes(interest)
    );
  }

  private isAgeMatch(content: Content, user: User): boolean {
    if (!user.birthDate || !content.target) {
      return false;
    }

    const age = this.calculateAge(user.birthDate);
    const target = content.target;

    // 대상 연령 파싱 (예: "65세 이상", "50-70세")
    if (target.includes('세')) {
      const targetAge = this.parseTargetAge(target);
      if (targetAge && age >= targetAge) {
        return true;
      }
    }

    return false;
  }

  private calculateDistance(content: Content, user: User): number {
    if (!content.organization?.latitude || !content.organization?.longitude) {
      return Infinity;
    }

    if (!user.profile?.latitude || !user.profile?.longitude) {
      return Infinity;
    }

    const R = 6371; // 지구 반경 (km)
    const lat1 = this.toRad(user.profile.latitude);
    const lat2 = this.toRad(content.organization.latitude);
    const dLat = this.toRad(content.organization.latitude - user.profile.latitude);
    const dLon = this.toRad(content.organization.longitude - user.profile.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private isApplicationAvailable(content: Content): boolean {
    const now = new Date();

    if (content.applicationStartAt && content.applicationStartAt > now) {
      return false;
    }

    if (content.applicationEndAt && content.applicationEndAt < now) {
      return false;
    }

    return true;
  }

  private isConnectedOrganization(content: Content, userOrganizations: Organization[]): boolean {
    if (!content.organizationId || !userOrganizations) {
      return false;
    }

    return userOrganizations.some(org => org.id === content.organizationId);
  }

  private isDeadlineApproaching(content: Content): boolean {
    if (!content.applicationEndAt) {
      return false;
    }

    const now = new Date();
    const deadline = new Date(content.applicationEndAt);
    const daysUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    return daysUntilDeadline <= 3 && daysUntilDeadline > 0;
  }

  private generateReason(content: Content, user: User): string {
    const reasons: string[] = [];

    if (this.isRegionMatch(content, user)) {
      reasons.push('지역');
    }

    if (this.isInterestMatch(content, userInterests)) {
      reasons.push('관심분야');
    }

    if (this.isConnectedOrganization(content, userOrganizations)) {
      reasons.push('연결된 기관');
    }

    if (this.isDeadlineApproaching(content)) {
      reasons.push('마감 임박');
    }

    return reasons.join(', ') + ' 일치';
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  private parseTargetAge(target: string): number | null {
    // "65세 이상" -> 65
    // "50-70세" -> 50
    const match = target.match(/(\d+)세/);
    return match ? parseInt(match[1], 10) : null;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
```

## 추천 캐싱

### Redis 캐싱

```typescript
class RecommendationService {
  async getRecommendations(userId: number, limit: number = 10): Promise<RecommendedContent[]> {
    const cacheKey = `user:${userId}:recommendations`;

    // 캐시 확인
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // 추천 계산
    const recommendations = await this.calculateRecommendations(userId, limit);

    // 캐시 저장 (1시간)
    await this.redisService.setex(cacheKey, 3600, JSON.stringify(recommendations));

    return recommendations;
  }

  async invalidateRecommendations(userId: number): Promise<void> {
    const cacheKey = `user:${userId}:recommendations`;
    await this.redisService.del(cacheKey);
  }
}
```

### 캐시 무효화

사용자 정보 변경 시 캐시 무효화:
- 지역 변경
- 관심분야 변경
- 기관 연결/해제

```typescript
class UserService {
  async updateProfile(userId: number, profile: UserProfile): Promise<void> {
    await this.userRepository.update(userId, { profile });
    await this.recommendationService.invalidateRecommendations(userId);
  }

  async connectOrganization(userId: number, organizationId: number): Promise<void> {
    await this.userOrganizationRepository.save({ userId, organizationId });
    await this.recommendationService.invalidateRecommendations(userId);
  }
}
```

## 추천 스트래티지

### Strategy Pattern

```typescript
interface RecommendationStrategy {
  name: string;
  calculateScore(content: Content, context: RecommendationContext): number;
}

interface RecommendationContext {
  user: User;
  userOrganizations: Organization[];
  userInterests: string[];
}

class RegionStrategy implements RecommendationStrategy {
  name = 'REGION';

  calculateScore(content: Content, context: RecommendationContext): number {
    if (this.isRegionMatch(content, context.user)) {
      return 40;
    }
    return 0;
  }

  private isRegionMatch(content: Content, user: User): boolean {
    // 지역 일치 로직
  }
}

class InterestStrategy implements RecommendationStrategy {
  name = 'INTEREST';

  calculateScore(content: Content, context: RecommendationContext): number {
    if (this.isInterestMatch(content, context.userInterests)) {
      return 30;
    }
    return 0;
  }

  private isInterestMatch(content: Content, interests: string[]): boolean {
    // 관심분야 일치 로직
  }
}

class RecommendationService {
  private strategies: RecommendationStrategy[] = [
    new RegionStrategy(),
    new InterestStrategy(),
    new AgeStrategy(),
    new DistanceStrategy(),
    new OrganizationStrategy(),
  ];

  private calculateScore(
    content: Content,
    context: RecommendationContext,
  ): number {
    return this.strategies.reduce((total, strategy) => {
      return total + strategy.calculateScore(content, context);
    }, 0);
  }
}
```

## 향후 고도화

### 사용자 행동 데이터 활용

추가 데이터:
- 조회 기록
- 클릭 기록
- 관심 등록
- 신청 기록
- 알림 반응
- 관심 없음

### AI/ML 모델로 교체

```typescript
// 향후 ML 모델로 교체 가능
class MLRecommendationStrategy implements RecommendationStrategy {
  name = 'ML';

  async calculateScore(content: Content, context: RecommendationContext): Promise<number> {
    // ML 모델을 사용한 점수 계산
    const features = this.extractFeatures(content, context);
    const score = await this.mlModel.predict(features);
    return score;
  }

  private extractFeatures(content: Content, context: RecommendationContext): number[] {
    // 특징 추출
  }
}
```

### 개인화 강화

- 시간대별 추천
- 계절별 추천
- 사용자 패턴 학습
- 협업 필터링

## 추천 결과 형식

```typescript
interface RecommendedContent {
  id: number;
  type: string;
  category: string;
  title: string;
  description: string;
  location: string;
  target: string;
  startAt: Date;
  endAt: Date;
  applicationEndAt: Date;
  organization: {
    id: number;
    name: string;
    type: string;
  };
  sourceUrl: string;
  recommendationReason: string;
  score: number;
}
```

## 추천 API

### GET /recommendations

```typescript
@Get()
async getRecommendations(
  @Request() req,
  @Query('limit') limit: number = 10,
): Promise<RecommendedContent[]> {
  const userId = req.user.id;
  return this.recommendationService.getRecommendations(userId, limit);
}
```

## 추천 알림

### 일일 추천 알림

```typescript
class NotificationWorker {
  @Cron('0 9 * * *') // 매일 9시
  async sendDailyRecommendations(): Promise<void> {
    const users = await this.getActiveUsers();

    for (const user of users) {
      const recommendations = await this.recommendationService.getRecommendations(user.id, 3);

      if (recommendations.length > 0) {
        await this.sendRecommendationNotification(user.id, recommendations);
      }
    }
  }

  private async sendRecommendationNotification(
    userId: number,
    recommendations: RecommendedContent[],
  ): Promise<void> {
    const title = '✨ 이런 거 어때요?';
    const body = `회원님 주변에서 참여할 수 있는 ${recommendations.length}개의 프로그램이 있습니다.`;

    await this.notificationService.createNotification(userId, {
      type: 'RECOMMENDATION',
      title,
      body,
      referenceType: 'CONTENT',
      referenceId: recommendations[0].id,
    });

    await this.pushService.sendPush(userId, {
      title,
      body,
      data: {
        type: 'RECOMMENDATION',
        contentId: recommendations[0].id,
      },
    });
  }
}
```

## A/B 테스트 지원

향후 A/B 테스트를 위한 구조:

```typescript
class RecommendationService {
  async getRecommendations(userId: number, limit: number = 10): Promise<RecommendedContent[]> {
    const variant = await this.getABTestVariant(userId);

    switch (variant) {
      case 'A':
        return this.getRecommendationsV1(userId, limit);
      case 'B':
        return this.getRecommendationsV2(userId, limit);
      default:
        return this.getRecommendationsV1(userId, limit);
    }
  }

  private async getABTestVariant(userId: number): Promise<string> {
    // A/B 테스트 그룹 할당 로직
  }
}
```

## 모니터링

### 추천 품질 모니터링

```typescript
class RecommendationMonitor {
  async logRecommendationView(userId: number, contentId: number): Promise<void> {
    await this.recommendationLogRepository.save({
      userId,
      contentId,
      action: 'VIEW',
      timestamp: new Date(),
    });
  }

  async logRecommendationClick(userId: number, contentId: number): Promise<void> {
    await this.recommendationLogRepository.save({
      userId,
      contentId,
      action: 'CLICK',
      timestamp: new Date(),
    });
  }

  async getCTR(userId: number): Promise<number> {
    const views = await this.recommendationLogRepository.count({
      where: { userId, action: 'VIEW' },
    });

    const clicks = await this.recommendationLogRepository.count({
      where: { userId, action: 'CLICK' },
    });

    return views > 0 ? clicks / views : 0;
  }
}
```

## 성능 최적화

### 인덱스 활용

```sql
-- 콘텐츠 조회 최적화
CREATE INDEX idx_contents_start_end ON contents(start_at, end_at);
CREATE INDEX idx_contents_application_end ON contents(application_end_at);
CREATE INDEX idx_contents_category ON contents(category);
CREATE INDEX idx_contents_organization ON contents(organization_id);
```

### 배치 처리

```typescript
class RecommendationService {
  async batchRecommendations(userIds: number[]): Promise<Map<number, RecommendedContent[]>> {
    const results = new Map<number, RecommendedContent[]>();

    // 병렬 처리
    await Promise.all(
      userIds.map(async userId => {
        const recommendations = await this.getRecommendations(userId);
        results.set(userId, recommendations);
      }),
    );

    return results;
  }
}
```

## 요약

MVP에서는 규칙 기반 추천을 사용하며, 향후 다음과 같이 고도화할 수 있습니다:
1. 사용자 행동 데이터 수집
2. AI/ML 모델 도입
3. 개인화 강화
4. A/B 테스트
5. 실시간 추천
