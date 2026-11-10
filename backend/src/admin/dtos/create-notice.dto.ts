import { z } from 'zod';

export const createNoticeSchema = z.object({
  title: z.string().min(1, '제목은 필수입니다'),
  content: z.string().min(1, '내용은 필수입니다'),
  scope: z.enum(['public', 'private']).optional(),
  organizationId: z.string().optional(),
  isPinned: z.boolean().optional(),
});

export type CreateNoticeDto = z.infer<typeof createNoticeSchema>;

export class CreateNoticeDtoClass {
  title: string;
  content: string;
  scope?: 'public' | 'private';
  organizationId?: string;
  isPinned?: boolean;
}