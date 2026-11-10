import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  birthDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  birthDate: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  region: z.string().optional(),
  district: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const updateInterestsSchema = z.object({
  interests: z.array(z.string()).min(1),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type UpdateInterestsDto = z.infer<typeof updateInterestsSchema>;
