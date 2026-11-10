# Notification

## 개요
Web Push 기반의 알림 시스템으로, 새로운 콘텐츠, 추천, 마감 임박 등의 알림을 사용자에게 전달합니다.

## 알림 종류

### 1. 신규 콘텐츠 알림
- 조건: 사용자가 연결한 기관에 새로운 콘텐츠 등록
- 내용: "○○복지관에 새로운 프로그램이 등록되었습니다."

### 2. 추천 알림
- 조건: 일일 추천 (하루 1회 묶어서 발송)
- 내용: "✨ 이런 거 어때요? 회원님 주변에서 참여할 수 있는 프로그램이 있습니다."

### 3. 마감 임박 알림
- 조건: 신청 마감 3일 이내
- 내용: "⏰ 신청 마감이 내일입니다. 건강체조 프로그램"

## Web Push 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend                                │
│                    (Service Worker)                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Push Subscription                           │
│              (endpoint, p256dh, auth)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend API                                  │
│              (Subscription 저장)                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                Notification Worker                           │
│              (알림 생성 및 발송 스케줄링)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Web Push Service                           │
│              (VAPID 인증, 푸시 발송)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Push Service                               │
│              (FCM, Web Push Protocol)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   사용자 기기                                 │
└─────────────────────────────────────────────────────────────┘
```

## Push Subscription

### 구독 프로세스

```typescript
// Frontend
async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  // Backend로 구독 정보 전송
  await fetch('/api/notifications/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
        auth: arrayBufferToBase64(subscription.getKey('auth')),
      },
      device_uuid: generateDeviceUUID(),
    }),
  });
}
```

### 구독 저장

```typescript
class PushSubscriptionService {
  async subscribe(userId: number, subscription: PushSubscriptionDto): Promise<void> {
    const existing = await this.pushSubscriptionRepository.findOne({
      where: {
        userId,
        endpoint: subscription.endpoint,
      },
    });

    if (!existing) {
      const pushSubscription = this.pushSubscriptionRepository.create({
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        deviceUuid: subscription.device_uuid,
        status: 'ACTIVE',
      });
      await this.pushSubscriptionRepository.save(pushSubscription);
    } else {
      // 기존 구독 정보 업데이트
      await this.pushSubscriptionRepository.update(existing.id, {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        deviceUuid: subscription.device_uuid,
        status: 'ACTIVE',
        updatedAt: new Date(),
      });
    }
  }

  async unsubscribe(userId: number, endpoint: string): Promise<void> {
    await this.pushSubscriptionRepository.update(
      { userId, endpoint },
      { status: 'INACTIVE', updatedAt: new Date() },
    );
  }
}
```

## VAPID (Voluntary Application Server Identification)

### VAPID 키 생성

```bash
# VAPID 키 쌍 생성
npm install web-push -g
web-push generate-vapid-keys
```

### 환경변수 설정

```env
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@example.com
```

### VAPID 설정

```typescript
import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);
```

## 알림 생성

### Notification Service

```typescript
class NotificationService {
  async createNotification(
    userId: number,
    notification: CreateNotificationDto,
  ): Promise<Notification> {
    const notif = this.notificationRepository.create({
      userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      organizationId: notification.organizationId,
      referenceType: notification.referenceType,
      referenceId: notification.referenceId,
    });

    return this.notificationRepository.save(notif);
  }

  async markAsRead(notificationId: number, userId: number): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId, userId },
      { readAt: new Date() },
    );

    // 캐시 무효화
    await this.redisService.del(`user:${userId}:notifications:unread`);
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepository.update(
      { userId, readAt: IsNull() },
      { readAt: new Date() },
    );

    // 캐시 무효화
    await this.redisService.del(`user:${userId}:notifications:unread`);
  }

  async getUnreadCount(userId: number): Promise<number> {
    const cacheKey = `user:${userId}:notifications:unread`;

    // 캐시 확인
    const cached = await this.redisService.get(cacheKey);
    if (cached !== null) {
      return parseInt(cached, 10);
    }

    const count = await this.notificationRepository.count({
      where: { userId, readAt: IsNull() },
    });

    // 캐시 저장 (5분)
    await this.redisService.setex(cacheKey, 300, count.toString());

    return count;
  }
}
```

## Web Push 발송

### Push Service

```typescript
class PushService {
  async sendPush(userId: number, payload: PushPayload): Promise<void> {
    // 활성 구독 조회
    const subscriptions = await this.pushSubscriptionRepository.find({
      where: { userId, status: 'ACTIVE' },
    });

    // 병렬 발송
    await Promise.all(
      subscriptions.map(subscription =>
        this.sendToSubscription(subscription, payload),
      ),
    );
  }

  private async sendToSubscription(
    subscription: PushSubscription,
    payload: PushPayload,
  ): Promise<void> {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        JSON.stringify(payload),
      );
    } catch (error) {
      // 구독 실패 시 비활성화
      if (error.statusCode === 410) {
        await this.pushSubscriptionRepository.update(subscription.id, {
          status: 'INACTIVE',
        });
      }
      console.error('Push send error:', error);
    }
  }
}
```

## 알림 Worker

### 스케줄러

```typescript
class NotificationWorker {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly pushService: PushService,
    private readonly recommendationService: RecommendationService,
  ) {}

  // 매일 9시에 일일 추천 알림
  @Cron('0 9 * * *')
  async sendDailyRecommendations(): Promise<void> {
    const users = await this.getActiveUsers();

    for (const user of users) {
      const settings = await this.getNotificationSettings(user.id);

      if (settings.recommendationEnabled && settings.recommendationFrequency === 'DAILY') {
        await this.sendRecommendationNotification(user.id);
      }
    }
  }

  // 매시간 신규 콘텐츠 알림 확인
  @Cron('0 * * * *')
  async checkNewContents(): Promise<void> {
    const users = await this.getActiveUsers();

    for (const user of users) {
      const settings = await this.getNotificationSettings(user.id);

      if (settings.newContentEnabled) {
        await this.sendNewContentNotifications(user.id);
      }
    }
  }

  // 매일 6시에 마감 임박 알림
  @Cron('0 6 * * *')
  async sendDeadlineAlerts(): Promise<void> {
    const users = await this.getActiveUsers();

    for (const user of users) {
      const settings = await this.getNotificationSettings(user.id);

      if (settings.deadlineAlertEnabled) {
        await this.sendDeadlineNotifications(user.id);
      }
    }
  }

  private async sendRecommendationNotification(userId: number): Promise<void> {
    const recommendations = await this.recommendationService.getRecommendations(userId, 3);

    if (recommendations.length > 0) {
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

  private async sendNewContentNotifications(userId: number): Promise<void> {
    const userOrganizations = await this.getUserOrganizations(userId);
    const newContents = await this.getNewContents(userOrganizations);

    for (const content of newContents) {
      const title = '📢 새로운 소식';
      const body = `${content.organization.name}에 새로운 프로그램이 등록되었습니다.`;

      await this.notificationService.createNotification(userId, {
        type: 'NEW_CONTENT',
        title,
        body,
        organizationId: content.organizationId,
        referenceType: 'CONTENT',
        referenceId: content.id,
      });

      await this.pushService.sendPush(userId, {
        title,
        body,
        data: {
          type: 'NEW_CONTENT',
          contentId: content.id,
          organizationId: content.organizationId,
        },
      });
    }
  }

  private async sendDeadlineNotifications(userId: number): Promise<void> {
    const deadlineContents = await this.getDeadlineContents(userId);

    for (const content of deadlineContents) {
      const daysUntilDeadline = this.getDaysUntil(content.applicationEndAt);
      const title = '⏰ 신청 마감 임박';
      const body = `${content.title} 신청 마감이 ${daysUntilDeadline}일 남았습니다.`;

      await this.notificationService.createNotification(userId, {
        type: 'DEADLINE_APPROACHING',
        title,
        body,
        referenceType: 'CONTENT',
        referenceId: content.id,
      });

      await this.pushService.sendPush(userId, {
        title,
        body,
        data: {
          type: 'DEADLINE_APPROACHING',
          contentId: content.id,
        },
      });
    }
  }

  private async getActiveUsers(): Promise<User[]> {
    // 활성 사용자 조회
    return this.userRepository.find({
      where: { status: 'ACTIVE' },
      relations: ['profile'],
    });
  }

  private async getNotificationSettings(userId: number): Promise<NotificationSettings> {
    return this.notificationSettingsRepository.findOne({ where: { userId } });
  }

  private getDaysUntil(date: Date): number {
    const now = new Date();
    const deadline = new Date(date);
    return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }
}
```

## 알림 설정

### Notification Settings

```typescript
class NotificationSettingsService {
  async getSettings(userId: number): Promise<NotificationSettings> {
    let settings = await this.notificationSettingsRepository.findOne({
      where: { userId },
    });

    if (!settings) {
      settings = this.notificationSettingsRepository.create({
        userId,
        newContentEnabled: true,
        recommendationEnabled: true,
        deadlineAlertEnabled: true,
        recommendationFrequency: 'DAILY',
      });
      await this.notificationSettingsRepository.save(settings);
    }

    return settings;
  }

  async updateSettings(
    userId: number,
    settings: UpdateNotificationSettingsDto,
  ): Promise<NotificationSettings> {
    await this.notificationSettingsRepository.update(userId, settings);
    return this.getSettings(userId);
  }
}
```

## 알림 제한

### 발송 빈도 제한

- 추천 알림: 하루 1회
- 신규 콘텐츠 알림: 기관당 하루 1회
- 마감 임박 알림: 콘텐츠당 1회

### Rate Limiting

```typescript
class RateLimiter {
  private readonly limits = {
    RECOMMENDATION: { max: 1, window: 24 * 60 * 60 * 1000 }, // 1일 1회
    NEW_CONTENT: { max: 5, window: 24 * 60 * 60 * 1000 }, // 1일 5회
    DEADLINE: { max: 3, window: 24 * 60 * 60 * 1000 }, // 1일 3회
  };

  async canSend(userId: number, type: string): Promise<boolean> {
    const limit = this.limits[type];
    if (!limit) return true;

    const key = `notification:${userId}:${type}`;
    const count = await this.redisService.incr(key);

    if (count === 1) {
      await this.redisService.expire(key, limit.window / 1000);
    }

    return count <= limit.max;
  }
}
```

## Service Worker

### 등록

```typescript
// Frontend
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => console.log('SW registered'))
    .catch(error => console.log('SW registration failed', error));
}
```

### 푸시 수신

```javascript
// sw.js
self.addEventListener('push', event => {
  const options = {
    body: event.data?.text() || '새로운 알림이 있습니다.',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: event.data?.json(),
    actions: [
      {
        action: 'view',
        title: '보기',
      },
      {
        action: 'close',
        title: '닫기',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification('알림', options),
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'view') {
    const data = event.notification.data;
    const url = data?.contentId ? `/contents/${data.contentId}` : '/';

    event.waitUntil(
      clients.openWindow(url),
    );
  }
});
```

## 알림 API

### POST /notifications/subscribe
Web Push 구독

### DELETE /notifications/subscribe
Web Push 구독 해제

### GET /notifications
알림 목록 조회

### PATCH /notifications/:id/read
알림 읽음 처리

### PATCH /notifications/read-all
전체 알림 읽음 처리

### GET /notifications/unread-count
읽지 않은 알림 수 조회

### GET /notifications/settings
알림 설정 조회

### PATCH /notifications/settings
알림 설정 수정

## 에러 처리

### 구독 실패
- 410 Gone: 구독 만료 → 비활성화 처리
- 404 Not Found: 엔드포인트 없음 → 구독 삭제
- 429 Too Many Requests: Rate Limit 초과 → 재시도

### 발송 실패
- 개별 구독 실패는 전체 발송에 영향 없음
- 실패 로그 기록
- 실패한 구독 비활성화

## 보안

### VAPID 인증
- VAPID 키로 서버 인증
- Private Key 보호 (환경변수)

### 사용자 동의
- 명시적 구독 동의 필요
- 구독 해제 기능 제공

### 데이터 보호
- 알림 내용에 민감 정보 포함 금지
- 필요한 경우 암호화

## 모니터링

### 발송 통계

```typescript
class NotificationMonitor {
  async logSentNotification(
    userId: number,
    type: string,
    success: boolean,
  ): Promise<void> {
    await this.notificationLogRepository.save({
      userId,
      type,
      success,
      timestamp: new Date(),
    });
  }

  async getDeliveryRate(type: string): Promise<number> {
    const total = await this.notificationLogRepository.count({ where: { type } });
    const success = await this.notificationLogRepository.count({
      where: { type, success: true },
    });

    return total > 0 ? success / total : 0;
  }
}
```

## 요약

- Web Push 기반 알림 시스템
- 신규 콘텐츠, 추천, 마감 임박 알림
- VAPID 인증
- 발송 빈도 제한
- 알림 설정 기능
- Service Worker 통합
