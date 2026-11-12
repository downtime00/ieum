import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type BookingStatus =
  | 'REQUESTED'    // 이용 요청됨 (공영자 수락 대기)
  | 'ACCEPTED'     // 공영자 수락 (입금 대기)
  | 'PAID'         // 이용자 입금 완료 (플랫폼 보관 — 에스크로)
  | 'COMPLETED'    // 공영자 운영 완료 처리 (이용자 확인 대기)
  | 'SETTLED'      // 이용자 확인 → 공영자 정산 완료
  | 'REJECTED'     // 공영자 거절
  | 'CANCELLED'    // 취소 (미입금)
  | 'REFUNDED';    // 취소 (입금 후 환불 처리)

@Entity('program_bookings')
export class ProgramBooking {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'program_id', type: 'bigint' })
  programId: number;

  @Column({ name: 'operator_id', type: 'bigint' })
  operatorId: number;

  @Column({ name: 'requester_user_id', type: 'bigint' })
  requesterUserId: number;

  @Column({ name: 'requester_name', type: 'varchar', length: 100, nullable: true })
  requesterName: string | null;

  @Column({ type: 'int', default: 1 })
  headcount: number;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Column({ type: 'varchar', length: 20, default: 'REQUESTED' })
  status: BookingStatus;

  // 금액 스냅샷 (예약 시점 가격/수수료율 기준)
  @Column({ name: 'unit_price', type: 'int', default: 0 })
  unitPrice: number;

  @Column({ name: 'total_amount', type: 'int', default: 0 })
  totalAmount: number;

  @Column({ name: 'fee_rate', type: 'decimal', precision: 5, scale: 2, default: 10 })
  feeRate: number;

  @Column({ name: 'platform_fee', type: 'int', default: 0 })
  platformFee: number;

  // 공영자 정산 예정액 = totalAmount - platformFee
  @Column({ name: 'operator_amount', type: 'int', default: 0 })
  operatorAmount: number;

  // 결제 방식: MANUAL(계좌입금 수동확인) / PAYMENT(PG 추후)
  @Column({ name: 'payment_method', type: 'varchar', length: 20, nullable: true })
  paymentMethod: string | null;

  @Column({ name: 'payer_name', type: 'varchar', length: 100, nullable: true })
  payerName: string | null;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'settled_at', type: 'timestamptz', nullable: true })
  settledAt: Date | null;

  @Column({ name: 'cancel_reason', type: 'text', nullable: true })
  cancelReason: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
