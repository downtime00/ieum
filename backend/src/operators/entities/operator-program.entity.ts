import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('operator_programs')
export class OperatorProgram {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'operator_id', type: 'bigint' })
  operatorId: number;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // 공연 / 강의 / 체험 / 기타
  @Column({ type: 'varchar', length: 50, default: '기타' })
  category: string;

  @Column({ name: 'event_date', type: 'date' })
  eventDate: string;

  // "14:00" 형식 (nullable)
  @Column({ name: 'start_time', type: 'varchar', length: 10, nullable: true })
  startTime: string | null;

  @Column({ name: 'duration_min', type: 'int', nullable: true })
  durationMin: number | null;

  // 1인 가격 (원)
  @Column({ type: 'int', default: 0 })
  price: number;

  @Column({ type: 'int', default: 30 })
  capacity: number;

  @Column({ name: 'booked_count', type: 'int', default: 0 })
  bookedCount: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string | null;

  @Column({ name: 'contact_phone', type: 'varchar', length: 50, nullable: true })
  contactPhone: string | null;

  @Column({ name: 'thumbnail_url', type: 'varchar', length: 500, nullable: true })
  thumbnailUrl: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
