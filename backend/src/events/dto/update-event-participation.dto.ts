import { z } from 'zod';
import { ParticipationStatus } from '../entities/event-participation.entity';

export const updateEventParticipationSchema = z.object({
  status: z.nativeEnum(ParticipationStatus).optional(),
  notes: z.string().max(500, '메모는 500자 이내여야 합니다').optional(),
  participantsCount: z.number().int().min(0).optional(),
});

export type UpdateEventParticipationDto = z.infer<typeof updateEventParticipationSchema>;

export class UpdateEventParticipationDtoClass {
  status?: ParticipationStatus;
  notes?: string;
  participantsCount?: number;
}
