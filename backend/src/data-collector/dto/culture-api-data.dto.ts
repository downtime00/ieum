import { z } from 'zod';

/** 
 * 문화 API 데이터 수집 Zod 스키마
 */
export const cultureApiDataRequestSchema = z.object({
  /**
   * 지역 코드 (필수)
   */
  areaCode: z.string().min(1, '지역 코드는 필수입니다'),
  
  /**
   * 수집 URL (필수)
   */
  url: z.string().url('유효한 URL 이어야 합니다').min(1, 'URL 은 필수입니다'),
  
  /**
   * 카테고리 코드
   */
  categoryCode: z.string().optional(),
  
  /**
   * 수집 날짜
   */
  collectionDate: z.string().optional(),
});

export type CultureApiDataDto = z.infer<typeof cultureApiDataRequestSchema>;
export default cultureApiDataRequestSchema;