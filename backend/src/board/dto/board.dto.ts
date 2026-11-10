import { z } from 'zod';

export const createPostSchema = z.object({
  familyId: z.number().int().positive(),
  userId: z.number().int().positive(),
  title: z.string().min(1, '제목은 필수입니다').max(200),
  content: z.string().min(1, '내용은 필수입니다').max(5000),
  isNotice: z.boolean().optional(),
  // 공개 그룹 게시글 노출 기간 (YYYY-MM-DD)
  visibleFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다').optional(),
  visibleUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다').optional(),
});

export const createCommentSchema = z.object({
  postId: z.number().int().positive(),
  userId: z.number().int().positive(),
  content: z.string().min(1, '내용은 필수입니다').max(2000),
});

export const createFamilySchema = z.object({
  userId: z.number().int().positive(),
  name: z.string().min(1, '가족 이름은 필수입니다').max(100),
});

export const joinFamilySchema = z.object({
  userId: z.number().int().positive(),
  code: z.string().min(1, '초대 코드는 필수입니다').max(20),
});

export type CreatePostDto = z.infer<typeof createPostSchema>;
export type CreateCommentDto = z.infer<typeof createCommentSchema>;
export type CreateBoardFamilyDto = z.infer<typeof createFamilySchema>;
export type JoinFamilyDto = z.infer<typeof joinFamilySchema>;
