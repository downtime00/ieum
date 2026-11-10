import { z } from 'zod';

export const pushMessageSchema = z.object({
  title: z.string().min(1, '제목은 필수입니다'),
  content: z.string().min(1, '내용은 필수입니다'),
  type: z.enum(['ANNOUNCEMENT', 'NEW_CONTENT', 'EVENT_START', 'FAVORITE_CONTENT', 'EVENT_OVERSOLD']).optional(),
  userId: z.number().int().positive().optional(),
  priority: z.enum(['HIGH', 'NORMAL', 'LOW']).optional(),
  orgId: z.number().int().positive().optional(),
});

export type PushMessageDto = z.infer<typeof pushMessageSchema>;
export type NotificationType = z.infer<typeof pushMessageSchema.shape.type>;

export class PushMessageDtoClass {
  title: string;
  content: string;
  type?: NotificationType;
  userId?: number;
  priority?: 'HIGH' | 'NORMAL' | 'LOW';
  orgId?: number;

  getPriorityColor(): string {
    switch (this.priority) {
      case 'HIGH':
        return '#ff4d4f';
      case 'LOW':
        return '#909399';
      default:
        return '#f56c6c';
    }
  }
}