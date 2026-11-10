import { z } from 'zod';

export const emailLoginSchema = z.object({
  email: z.string().email('유효한 이메일이어야 합니다'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
});

export type EmailLoginDto = z.infer<typeof emailLoginSchema>;
