import { z } from 'zod';

/** 
 * 콘텐츠 업데이트 요청 Zod 스키마 (Category ID 포함)
 */
export const updateContentRequestSchema = z.object({
  /**
   * 제목
   */
  title: z.string().min(1, '제목은 필수입니다').max(100).optional(),
  
  /**
   * 설명
   */
  description: z.string().optional(),
  
  /**
   * 콘텐츠 URL
   */
  contentUrl: z.string().url('콘텐츠 URL 이 유효하지 않습니다').min(1, '콘텐츠 URL 은 필수입니다').optional(),
  
  /**
   * 썸네일 URL
   */
  thumbnailUrl: z.string().optional(),
  
  /**
   * 카테고리 ID (선택)
   */
  categoryId: z.number().int().positive('카테고리 ID 는 양의 정수여야 합니다').optional(),
});

export type UpdateContentDto = z.infer<typeof updateContentRequestSchema>;
export default updateContentRequestSchema;