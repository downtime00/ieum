import { z } from 'zod';

export const createNotificationSchema = z.object({
  userId: z.number().int().positive(),
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  type: z.enum(['INFO', 'ANNOUNCEMENT', 'ALERT', 'CONTENT', 'FAMILY']),
  payload: z.string().optional(),
});

export type CreateNotificationDto = z.infer<typeof createNotificationSchema>;
export type NotificationType = z.infer<typeof createNotificationSchema.shape.type>;
export const NotificationTypeEnum = createNotificationSchema.shape.type;
