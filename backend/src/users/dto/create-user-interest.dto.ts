import { z } from 'zod';

export const createUserInterestSchema = z.object({
  category: z.string().optional(),
  interest: z.string().min(1, '관심사는 필수입니다'),
});

export type CreateUserInterestDto = z.infer<typeof createUserInterestSchema>;

export class CreateUserInterestDtoClass {
  category?: string | null;
  interest: string;
}