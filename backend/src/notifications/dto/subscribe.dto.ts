import { z } from 'zod';

export const subscribeSchema = z.object({
  userId: z.number().int().positive().optional(),
  orgId: z.number().int().positive().optional(),
  allContentEnabled: z.boolean().optional(),
});

export type SubscribeDto = z.infer<typeof subscribeSchema>;

export class SubscribeDtoClass {
  userId?: number;
  orgId?: number;
  allContentEnabled?: boolean;

  getSubscriptionName(): string {
    if (!this.userId && !this.orgId) {
      return 'all_channel'; // 전체 채널 구독
    }
    if (this.orgId) {
      return `org_${this.orgId}`; // 기관 구독
    }
    if (this.userId) {
      return `user_${this.userId}`; // 사용자 구독
    }
    return 'unknown';
  }
}