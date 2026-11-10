import { z } from 'zod';

export const searchQueryParamsSchema = z.object({
  region: z.string().optional(),
  category: z.string().optional(),
  orgId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  keyword: z.string().optional(),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  targetAge: z.string().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  limit: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  sortBy: z.enum(['createdAt', 'publishedAt', 'title']).optional(),
  sortOrder: z.enum(['DESC', 'ASC']).optional(),
});

export type SearchQueryParams = z.infer<typeof searchQueryParamsSchema>;
