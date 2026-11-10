import { z } from 'zod';

export const bulkNotificationSchema = z.object({
  userIds: z.array(z.number().int().positive()).min(1, '최소 1명 이상의 사용자를 지정해야 합니다'),
  title: z.string().min(1, '제목은 필수입니다').max(200),
  body: z.string().min(1, '내용은 필수입니다').max(1000),
  type: z.enum(['INFO', 'ANNOUNCEMENT', 'ALERT', 'CONTENT', 'FAMILY']).default('INFO'),
  payload: z.string().optional(),
});

export type BulkNotificationDto = z.infer<typeof bulkNotificationSchema>;

export class BulkNotificationDtoClass {
  userIds: number[];
  title: string;
  body: string;
  type?: 'INFO' | 'ANNOUNCEMENT' | 'ALERT' | 'CONTENT' | 'FAMILY';
  payload?: string;
}
