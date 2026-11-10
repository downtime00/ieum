import { z } from 'zod';
import { LogLevel } from '../entities/log.entity';

export const queryLogsSchema = z.object({
  level: z.enum([LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG, LogLevel.VERBOSE]).optional(),
  context: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type QueryLogsDto = z.infer<typeof queryLogsSchema>;
