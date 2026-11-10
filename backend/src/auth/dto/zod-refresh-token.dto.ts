import { z } from 'zod';

/** 
 * 토큰 새로고침 요청 Zod 스키마
 */
export const refreshTokenRequestSchema = z.object({
  /**
   * Refresh Token
   */
  refreshToken: z.string().min(1, 'Refresh Token 은 필수입니다'),
});

export type RefreshTokenDto = z.infer<typeof refreshTokenRequestSchema>;
export default refreshTokenRequestSchema;