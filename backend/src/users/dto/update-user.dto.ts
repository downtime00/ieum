import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  birthDate: z.string().optional(),
  region: z.string().optional(),
  district: z.string().optional(),
  phone: z.string().regex(/^010-\d{4}-\d{4}$/).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;

export class UpdateUserDtoClass {
  name?: string;
  birthDate?: string;
  region?: string;
  district?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
}
