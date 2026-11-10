import { z } from 'zod';

/** 
 * Zod 기반 Update Interests 스키마
 */
export const updateInterestsSchema = z.array(z.string().min(1, '관심사는 비어있을 수 없습니다'));

export type UpdateInterestsDto = z.infer<typeof updateInterestsSchema>;
export default updateInterestsSchema;