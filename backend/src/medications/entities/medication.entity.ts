import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('medications')
export class Medication {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  // 복용 대상 (가족 등록: 본인이 아닌 가족 이름/관계)
  @Column({ name: 'subject_name', type: 'varchar', length: 100, nullable: true })
  subjectName: string | null;

  @Column({ name: 'subject_relation', type: 'varchar', length: 50, nullable: true })
  subjectRelation: string | null;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  dosage: string | null;

  @Column({ name: 'times_per_day', type: 'int', default: 1 })
  timesPerDay: number;

  // 복용 시간 목록 (예: "08:00,13:00,20:00")
  @Column({ name: 'reminder_times', type: 'text', nullable: true })
  reminderTimes: string | null;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: string | null;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: string | null;

  // 복약 주의사항
  @Column({ type: 'text', nullable: true })
  precautions: string | null;

  // 다음 병원 예약일
  @Column({ name: 'appointment_date', type: 'date', nullable: true })
  appointmentDate: string | null;

  @Column({ name: 'appointment_note', type: 'varchar', length: 500, nullable: true })
  appointmentNote: string | null;

  @Column({ type: 'text', nullable: true })
  memo: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
