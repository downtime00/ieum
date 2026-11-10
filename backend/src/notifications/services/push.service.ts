import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as webpush from 'web-push';
import { PushSubscription, PushSubscriptionStatus } from '../entities/push-subscription.entity';

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export interface BrowserPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private enabled = false;

  constructor(
    @InjectRepository(PushSubscription)
    private readonly subscriptionRepo: Repository<PushSubscription>,
  ) {}

  onModuleInit() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (!publicKey || !privateKey || publicKey.includes('your-')) {
      this.logger.warn('VAPID 키가 설정되지 않아 웹 푸시가 비활성화되었습니다');
      return;
    }

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
      publicKey,
      privateKey,
    );
    this.enabled = true;
    this.logger.log('웹 푸시(VAPID) 초기화 완료');
  }

  getPublicKey(): string | null {
    const key = process.env.VAPID_PUBLIC_KEY;
    return key && !key.includes('your-') ? key : null;
  }

  async subscribe(userId: number | null, subscription: BrowserPushSubscription, deviceUuid?: string): Promise<PushSubscription> {
    const existing = await this.subscriptionRepo.findOne({ where: { endpoint: subscription.endpoint } });

    if (existing) {
      existing.userId = userId;
      existing.p256dh = subscription.keys.p256dh;
      existing.auth = subscription.keys.auth;
      existing.status = PushSubscriptionStatus.ACTIVE;
      if (deviceUuid) existing.deviceUuid = deviceUuid;
      return this.subscriptionRepo.save(existing);
    }

    return this.subscriptionRepo.save(
      this.subscriptionRepo.create({
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        deviceUuid: deviceUuid ?? null,
        status: PushSubscriptionStatus.ACTIVE,
      }),
    );
  }

  async unsubscribe(endpoint: string): Promise<void> {
    await this.subscriptionRepo.delete({ endpoint });
  }

  async sendToUser(userId: number, payload: PushPayload): Promise<void> {
    const subscriptions = await this.subscriptionRepo.find({
      where: { userId, status: PushSubscriptionStatus.ACTIVE },
    });
    await this.sendToSubscriptions(subscriptions, payload);
  }

  async sendToUsers(userIds: number[], payload: PushPayload): Promise<void> {
    if (userIds.length === 0) return;
    const subscriptions = await this.subscriptionRepo.find({
      where: { userId: userIds as any, status: PushSubscriptionStatus.ACTIVE },
    });
    await this.sendToSubscriptions(subscriptions, payload);
  }

  private async sendToSubscriptions(subscriptions: PushSubscription[], payload: PushPayload): Promise<void> {
    if (!this.enabled || subscriptions.length === 0) return;

    const body = JSON.stringify(payload);
    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
          { TTL: 60 * 60 },
        ),
      ),
    );

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'rejected') {
        const statusCode = (result.reason as any)?.statusCode;
        // 구독 만료/해지된 경우 비활성화
        if (statusCode === 404 || statusCode === 410) {
          await this.subscriptionRepo.update(subscriptions[i].id, { status: PushSubscriptionStatus.EXPIRED });
        }
        this.logger.warn(`푸시 전송 실패 (endpoint: ${subscriptions[i].endpoint.slice(0, 60)}...): ${result.reason?.message || result.reason}`);
      }
    }
  }
}
