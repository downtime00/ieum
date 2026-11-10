import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { JwtService } from '@nestjs/jwt';
import { NotificationType } from '../schemas/notification.schema';
import { PushService } from './push.service';

export { NotificationType };

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private jwtService: JwtService,
    private readonly pushService: PushService,
  ) {}

  async validateToken(token: string): Promise<any> {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      return { id: payload.sub, name: payload.name };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async create(userId: number, title: string, body: string, type: NotificationType, payload?: string): Promise<Notification> {
    const notification = this.notificationRepo.create({
      userId,
      title,
      body,
      type,
      payload,
    });
    const saved = await this.notificationRepo.save(notification);
    // 웹 푸시 전송 (실패해도 알림 저장은 유지)
    this.pushService.sendToUser(userId, { title, body }).catch((err) =>
      this.logger.warn(`웹 푸시 전송 실패 (userId: ${userId}): ${err?.message || err}`),
    );
    return saved;
  }

  /**
   * 특정 사용자 그룹에게 푸시 알림 전송
   */
  async sendToMultipleUsers(userIds: number[], title: string, body: string, type: NotificationType, payload?: string): Promise<Notification[]> {
    const notifications = await Promise.all(
      userIds.map(userId =>
        this.create(userId, title, body, type, payload)
      )
    );

    this.logger.log(`푸시 알림 ${notifications.length}개 전송 완료 (사용자: ${userIds.length}명)`);
    return notifications;
  }

  /**
   * 특정 기관 구독자에게 푸시 알림 전송
   */
  async sendToOrganizationSubscribers(organizationId: number, title: string, body: string, type: NotificationType, payload?: string): Promise<Notification[]> {
    // TODO: 기관 구독자 목록 조회 로직 추가 필요
    // 현재는 빈 배열 반환
    this.logger.warn(`기관 구독자 푸시 아직 구현되지 않음 (기관 ID: ${organizationId})`);
    return [];
  }

  /**
   * 특정 지역 사용자에게 푸시 알림 전송
   */
  async sendToRegionUsers(region: string, title: string, body: string, type: NotificationType, payload?: string): Promise<Notification[]> {
    // TODO: 지역별 사용자 조회 로직 추가 필요
    // 현재는 빈 배열 반환
    this.logger.warn(`지역별 푸시 아직 구현되지 않음 (지역: ${region})`);
    return [];
  }

  /**
   * 특정 관심사를 가진 사용자에게 푸시 알림 전송
   */
  async sendToInterestUsers(interests: string[], title: string, body: string, type: NotificationType, payload?: string): Promise<Notification[]> {
    // TODO: 관심사 기반 사용자 조회 로직 추가 필요
    // 현재는 빈 배열 반환
    this.logger.warn(`관심사 기반 푸시 아직 구현되지 않음 (관심사: ${interests.join(', ')})`);
    return [];
  }

  async getUserNotifications(userId: number, limit?: number): Promise<Notification[]> {
    return this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    await this.notificationRepo.update(notificationId, { isRead: true });
  }

  async getUserUnreadCount(userId: number): Promise<number> {
    const count = await this.notificationRepo.count({
      where: { userId, isRead: false },
    });
    return count;
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepo.update(
      { userId },
      { isRead: true },
    );
  }

  async getUnreadNotifications(userId: number): Promise<Notification[]> {
    return this.notificationRepo.find({
      where: { userId, isRead: false },
      order: { createdAt: 'DESC' },
    });
  }

  async getUserNotificationCount(userId: number): Promise<number> {
    const count = await this.notificationRepo.count({ where: { userId } });
    return count;
  }

  async clearAll(userId: number): Promise<void> {
    await this.notificationRepo.delete({ userId });
  }

  async deleteNotification(id: number, userId: number): Promise<void> {
    await this.notificationRepo.delete({ id, userId });
  }

  async getNotificationById(notificationId: number): Promise<Notification | null> {
    return this.notificationRepo.findOne({ where: { id: notificationId } });
  }

  async getAllNotifications(): Promise<Notification[]> {
    return this.notificationRepo.find({ order: { createdAt: 'DESC' } });
  }
}