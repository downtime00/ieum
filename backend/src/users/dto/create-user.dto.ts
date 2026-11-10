import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  birthDate: z.string().optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;

export class CreateUserDtoClass {
  name?: string | null;
  birthDate?: Date | null;
}