import { z } from 'zod';

/** 
 * 로그인 요청 Zod 스키마
 */
export const loginRequestSchema = z.object({
  /**
   * 소셜 로그인 provider (google, github 등)
   */
  provider: z.string().min(1, null), // message 없음 - validation pipe 로 처리
  
  /**
   * 인증 코드 (소셜 로그인 시)
   */
  code: z.string().optional(),
  
  /**
   * 상태 (CSRF 방지용)
   */
  state: z.string().optional(),
});

export type LoginRequestDto = z.infer<typeof loginRequestSchema>;
export default loginRequestSchema;