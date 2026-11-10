import { z } from 'zod';
import { UserRole } from '../../users/entities/user.entity';

export const createAdminSchema = z.object({
  name: z.string().min(1, '이름은 필수입니다').max(100),
  email: z.string().email('유효한 이메일이어야 합니다').min(1, '이메일은 필수입니다'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다').max(100),
  role: z.enum([UserRole.ADMIN, UserRole.SUPER_ADMIN]).default(UserRole.ADMIN),
  birthDate: z.string().optional(),
});

export type CreateAdminDto = z.infer<typeof createAdminSchema>;

export class CreateAdminDtoClass {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  birthDate?: string;
}
