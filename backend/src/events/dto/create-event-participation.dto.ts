import { z } from 'zod';
import { ParticipationStatus } from '../entities/event-participation.entity';

export const createEventParticipationSchema = z.object({
  userId: z.number().int().positive('사용자 ID는 양의 정수여야 합니다'),
  contentId: z.number().int().positive('콘텐츠 ID는 양의 정수여야 합니다'),
  status: z.nativeEnum(ParticipationStatus).default(ParticipationStatus.REGISTERED),
  notes: z.string().max(500, '메모는 500자 이내여야 합니다').optional(),
  participantsCount: z.number().int().min(0).default(1),
});

export type CreateEventParticipationDto = z.infer<typeof createEventParticipationSchema>;

export class CreateEventParticipationDtoClass {
  userId: number;
  contentId: number;
  status?: ParticipationStatus;
  notes?: string;
  participantsCount?: number;
}
