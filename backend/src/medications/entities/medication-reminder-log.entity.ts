import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * 복약/예약 알림 발송 이력 — 중복 발송 방지용
 * kind: 'dose'(복용 30분 전) | 'appt'(예약 D-7/D-3/D-1/D-day)
 */
@Entity('medication_reminder_logs')
@Index(['medicationId', 'kind', 'refKey'], { unique: true })
export class MedicationReminderLog {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'medication_id', type: 'bigint' })
  medicationId: number;

  @Column({ type: 'varchar', length: 10 })
  kind: 'dose' | 'appt';

  // dose: 'YYYY-MM-DD|HH:mm' / appt: '7' | '3' | '1' | '0'
  @Column({ name: 'ref_key', type: 'varchar', length: 50 })
  refKey: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
