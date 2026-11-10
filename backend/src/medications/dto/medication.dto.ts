import { z } from 'zod';

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜는 YYYY-MM-DD 형식이어야 합니다')
  .optional()
  .nullable();

export const medicationSchema = z.object({
  userId: z.number().int().positive(),
  name: z.string().min(1, '약 이름은 필수입니다').max(200),
  dosage: z.string().max(100).optional().nullable(),
  timesPerDay: z.number().int().min(1).default(1),
  reminderTimes: z.string().optional().nullable(),
  startDate: dateString,
  endDate: dateString,
  precautions: z.string().optional().nullable(),
  appointmentDate: dateString,
  appointmentNote: z.string().max(500).optional().nullable(),
  memo: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  subjectName: z.string().max(100).optional().nullable(),
  subjectRelation: z.string().max(50).optional().nullable(),
});

export const updateMedicationSchema = medicationSchema.partial().omit({ userId: true });

export type CreateMedicationDto = z.infer<typeof medicationSchema>;
export type UpdateMedicationDto = z.infer<typeof updateMedicationSchema>;
