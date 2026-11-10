import { z } from 'zod';

export const updateInterestsSchema = z.object({
  interests: z.array(z.string()).min(1, '관심사는 최소 1개 이상이어야 합니다'),
});

export type UpdateInterestsDto = z.infer<typeof updateInterestsSchema>;

export class UpdateInterestsDtoClass {
  interests: string[];
}
