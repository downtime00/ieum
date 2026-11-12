import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';

@Entity('operator_reviews')
@Unique('UQ_review_booking', ['bookingId'])
export class OperatorReview {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'booking_id', type: 'bigint' })
  bookingId: number;

  @Column({ name: 'operator_id', type: 'bigint' })
  operatorId: number;

  @Column({ name: 'program_id', type: 'bigint' })
  programId: number;

  @Column({ name: 'reviewer_user_id', type: 'bigint' })
  reviewerUserId: number;

  @Column({ name: 'reviewer_name', type: 'varchar', length: 100, nullable: true })
  reviewerName: string | null;

  // 1~5점
  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
