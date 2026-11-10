import { z } from 'zod';

export const tokenRefreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export type TokenRefreshDto = z.infer<typeof tokenRefreshSchema>;
