import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('operators')
export class Operator {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  // 기관 대표 사용자 ID
  @Column({ name: 'owner_user_id', type: 'bigint' })
  ownerUserId: number;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  // 기관 유형: 행복복지센터 / 실버타운 / 노인회관 / 복지관 / 기타
  @Column({ name: 'org_type', type: 'varchar', length: 50 })
  orgType: string;

  @Column({ name: 'business_number', type: 'varchar', length: 50, nullable: true })
  businessNumber: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // 정산 계좌 (수수료 차감 후 입금받을 계좌)
  @Column({ name: 'bank_name', type: 'varchar', length: 50, nullable: true })
  bankName: string | null;

  @Column({ name: 'bank_account', type: 'varchar', length: 100, nullable: true })
  bankAccount: string | null;

  @Column({ name: 'account_holder', type: 'varchar', length: 100, nullable: true })
  accountHolder: string | null;

  // PENDING(승인대기) / APPROVED(승인) / REJECTED(반려)
  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: string;

  // 플랫폼 수수료율 (%) — 예약 시점에 booking에 스냅샷 저장
  @Column({ name: 'fee_rate', type: 'decimal', precision: 5, scale: 2, default: 10 })
  feeRate: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
