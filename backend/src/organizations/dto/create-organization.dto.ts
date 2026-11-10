import { z } from 'zod';

export const createOrganizationSchema = z.object({
  name: z.string().min(1, '기관 이름은 필수입니다'),
  type: z.string().min(1, '기관 타입은 필수입니다'),
  domain: z.string().optional(),
});

export type CreateOrganizationDto = z.infer<typeof createOrganizationSchema>;

export class CreateOrganizationDtoClass {
  name: string;
  type: string;
  domain?: string;
}

// Update organization schema (Create organization schema 의 부분 스키마)
export const updateOrganizationSchema = createOrganizationSchema.partial();
export type UpdateOrganizationDto = z.infer<typeof updateOrganizationSchema>;

export class UpdateOrganizationDtoClass {
  name?: string;
  type?: string;
  domain?: string;
}
