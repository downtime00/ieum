import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(1, '그룹 이름은 필수입니다').max(100),
  description: z.string().max(1000).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
});

export type CreateGroupDto = z.infer<typeof createGroupSchema>;
