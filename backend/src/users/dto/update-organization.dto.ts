import { z } from 'zod';
import { createUserOrganizationSchema } from './create-organization.dto';

export const updateUserOrganizationSchema = createUserOrganizationSchema.partial();

export type UpdateOrganizationDto = z.infer<typeof updateUserOrganizationSchema>;

export class UpdateOrganizationDtoClass {
  type?: string | null;
  name?: string | null;
  address?: string | null;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}