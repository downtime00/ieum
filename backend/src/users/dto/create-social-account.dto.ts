import { z } from 'zod';
import { SocialAuthProvider } from '../entities/user-social-accounts.entity';

export const createSocialAccountSchema = z.object({
  provider: z.nativeEnum(SocialAuthProvider),
  providerUserId: z.string().min(1, 'Provider User ID는 필수입니다'),
  email: z.string().email('유효한 이메일이어야 합니다').min(1, '이메일은 필수입니다'),
  profileName: z.string().optional(),
  profileImage: z.string().optional(),
});

export type CreateSocialAccountDto = z.infer<typeof createSocialAccountSchema>;

export class CreateSocialAccountDtoClass {
  provider: SocialAuthProvider;
  providerUserId: string;
  email: string;
  profileName?: string | null;
  profileImage?: string | null;
}