import { z } from 'zod';

/** 
 * 콘텐츠 생성 요청 Zod 스키마
 */
export const createContentRequestSchema = z.object({
  /**
   * 제목 (필수)
   */
  title: z.string().min(1, '제목은 필수입니다').max(100),
  
  /**
   * 설명 (선택)
   */
  description: z.string().optional(),
  
  /**
   * 콘텐츠 URL (필수)
   */
  contentUrl: z.string().url('콘텐츠 URL 이 유효하지 않습니다').min(1, '콘텐츠 URL 은 필수입니다'),
  
  /**
   * 썸네일 URL (선택)
   */
  thumbnailUrl: z.string().optional(),
});

export type CreateContentDto = z.infer<typeof createContentRequestSchema>;
export default createContentRequestSchema;