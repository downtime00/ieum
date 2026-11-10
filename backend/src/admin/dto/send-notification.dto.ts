import { z } from 'zod';

export const sendNotificationSchema = z
  .object({
    title: z.string().min(1, '제목은 필수입니다').max(200),
    body: z.string().min(1, '내용은 필수입니다').max(1000),
    type: z.enum(['INFO', 'ANNOUNCEMENT', 'ALERT', 'CONTENT', 'FAMILY']).default('ANNOUNCEMENT'),
    payload: z.string().optional(),
    all: z.boolean().optional(),
    userIds: z.array(z.number().int().positive()).optional(),
  })
  .refine((data) => data.all === true || (data.userIds && data.userIds.length > 0), {
    message: '전체 발송 또는 1명 이상의 사용자를 지정해야 합니다',
  });

export type SendNotificationDto = z.infer<typeof sendNotificationSchema>;
