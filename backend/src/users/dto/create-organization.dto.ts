import { z } from 'zod';

export const createUserOrganizationSchema = z.object({
  type: z.string().min(1, '기관 타입은 필수입니다'),
  name: z.string().min(1, '기관 이름은 필수입니다'),
  address: z.string().optional(),
  phone: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type CreateOrganizationDto = z.infer<typeof createUserOrganizationSchema>;

export class CreateOrganizationDtoClass {
  type: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}