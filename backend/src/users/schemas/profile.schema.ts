import { z } from 'zod';

export const createUserProfileSchema = z.object({
  profileUrl: z.string().url().optional(),
  bio: z.string().max(1000).optional(),
  additionalInfo: z.record(z.string(), z.any()).optional(),
});

export type CreateUserProfileDto = z.infer<typeof createUserProfileSchema>;
