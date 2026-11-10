import { z } from 'zod';

/** 
 * Zod 기반 Update User 스키마
 * DTO 병행 사용 시 기존 class-validator 방식과 같이 사용 가능
 */
export const updateUserSchema = z.object({
  /**
   * 이름 (선택)
   */
  name: z.string().min(1, '이름은 필수입니다').optional(),
  
  /**
   * 생년월일 - YYYY-MM-DD 형식
   */
  birthDate: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        // YYYY-MM-DD 형식 유효성 검사
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        return dateRegex.test(val) ? new Date(val).toISOString() : undefined;
      }
      return val;
    },
    z.string().optional(),
  ).optional(),
  
  /**
   * 지역 (선택)
   */
  region: z.string().min(1, '지역은 필수입니다').optional(),
  
  /**
   * 구/군 (선택)
   */
  district: z.string().min(1, '구/군은 필수입니다').optional(),
  
  /**
   * 휴대폰 번호 (010-xxxx-xxxx 형식)
   */
  phone: z
    .string()
    .regex(/^010-\d{4}-\d{4}$/, null) // 유효성 검사만, message 없음
    .optional(),
  
  /**
   * 위도 (선택)
   */
  latitude: z.number().min(-90).max(90).optional(),
  
  /**
   * 경도 (선택)
   */
  longitude: z.number().min(-180).max(180).optional(),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export default updateUserSchema;