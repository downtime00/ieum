import { z } from 'zod';

// 유효값은 operator_org_types 테이블(DB)에서 관리 — 서비스 레이어에서 검증
export const ORG_TYPE_GROUPS = ['institution', 'individual'] as const;
export const createOrgTypeSchema = z.object({
  name: z.string().min(1, '유형명이 필요합니다').max(50),
  group: z.enum(ORG_TYPE_GROUPS),
  sortOrder: z.number().int().min(0).max(999).optional(),
  isActive: z.boolean().optional(),
});
export type CreateOrgTypeDto = z.infer<typeof createOrgTypeSchema>;
export const updateOrgTypeSchema = createOrgTypeSchema.partial();
export type UpdateOrgTypeDto = z.infer<typeof updateOrgTypeSchema>;

// 유효값은 operator_program_categories 테이블(DB)에서 관리 — 서비스 레이어에서 검증
export const createProgramCategorySchema = z.object({
  name: z.string().min(1, '분류명이 필요합니다').max(50),
  sortOrder: z.number().int().min(0).max(999).optional(),
  isActive: z.boolean().optional(),
});
export type CreateProgramCategoryDto = z.infer<typeof createProgramCategorySchema>;
export const updateProgramCategorySchema = createProgramCategorySchema.partial();
export type UpdateProgramCategoryDto = z.infer<typeof updateProgramCategorySchema>;

export const createOperatorSchema = z.object({
  userId: z.number().int().positive(),
  name: z.string().min(1, '이름 또는 기관명이 필요합니다').max(200),
  orgType: z.string().min(1, '기관 유형을 선택해주세요').max(50),
  businessNumber: z.string().max(50).optional(),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
  bankName: z.string().max(50).optional(),
  bankAccount: z.string().max(100).optional(),
  accountHolder: z.string().max(100).optional(),
});
export type CreateOperatorDto = z.infer<typeof createOperatorSchema>;

export const updateOperatorSchema = createOperatorSchema.omit({ userId: true }).partial();
export type UpdateOperatorDto = z.infer<typeof updateOperatorSchema>;

export const operatorStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});
export type OperatorStatusDto = z.infer<typeof operatorStatusSchema>;

export const createProgramSchema = z.object({
  userId: z.number().int().positive(),
  title: z.string().min(1, '제목이 필요합니다').max(200),
  description: z.string().max(5000).optional(),
  category: z.string().min(1).max(50).default('기타'),
  // B2C: 개인 이용자 대상 / B2B: 기관·요양원 대상 (기관 회원만 신청)
  programType: z.enum(['B2C', 'B2B']).optional(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식은 YYYY-MM-DD 입니다'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  durationMin: z.number().int().positive().max(1440).optional(),
  price: z.number().int().min(0, '가격은 0 이상이어야 합니다'),
  capacity: z.number().int().positive().max(10000),
  address: z.string().max(500).optional(),
  contactPhone: z.string().max(50).optional(),
  thumbnailUrl: z.string().url().max(500).optional(),
  isActive: z.boolean().optional(),
});
export type CreateProgramDto = z.infer<typeof createProgramSchema>;

export const updateProgramSchema = createProgramSchema.omit({ userId: true }).partial();
export type UpdateProgramDto = z.infer<typeof updateProgramSchema>;

export const createBookingSchema = z.object({
  userId: z.number().int().positive(),
  requesterName: z.string().max(100).optional(),
  headcount: z.number().int().positive().max(100),
  message: z.string().max(1000).optional(),
  // 그룹(가족) 단위 예약 시 필수 — 요양·간병/방문서비스는 반드시 지정, 그룹 예약은 그룹장(HEAD)만 가능
  familyId: z.number().int().positive().optional(),
  // 희망 장소 — 지도에서 선택한 좌표와 주소 (요양·간병/방문서비스는 사실상 필수 권장)
  desiredAddress: z.string().max(500).optional(),
  desiredLat: z.number().min(-90).max(90).optional(),
  desiredLng: z.number().min(-180).max(180).optional(),
}).refine(
  (d) => (d.desiredLat === undefined) === (d.desiredLng === undefined),
  { message: '위도와 경도는 함께 입력해야 합니다' },
);
export type CreateBookingDto = z.infer<typeof createBookingSchema>;

export const bookingActionSchema = z.object({
  userId: z.number().int().positive(),
  reason: z.string().max(500).optional(),
  payerName: z.string().max(100).optional(),
});
export type BookingActionDto = z.infer<typeof bookingActionSchema>;

export const createReviewSchema = z.object({
  userId: z.number().int().positive(),
  rating: z.number().int().min(1, '1~5점을 선택해주세요').max(5, '1~5점을 선택해주세요'),
  comment: z.string().max(1000).optional(),
});
export type CreateReviewDto = z.infer<typeof createReviewSchema>;

// 수락된 예약의 프로그램 안내 공지 (가족/그룹 멤버 대상)
export const sendBookingNoticeSchema = z.object({
  userId: z.number().int().positive(),
  familyId: z.number().int().positive(),
  // 비우면 전체 멤버, 지정하면 해당 멤버(가족 멤버 row id)만
  memberIds: z.array(z.number().int().positive()).max(200).optional(),
  message: z.string().max(500).optional(),
});
export type SendBookingNoticeDto = z.infer<typeof sendBookingNoticeSchema>;
