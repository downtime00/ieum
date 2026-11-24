import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export interface PollOption {
  text: string;
}

@Entity('family_polls')
export class FamilyPoll {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'family_id', type: 'bigint' })
  familyId: number;

  @Column({ name: 'author_user_id', type: 'bigint' })
  authorUserId: number;

  @Column({ name: 'author_name', type: 'varchar', length: 100 })
  authorName: string;

  @Column({ type: 'varchar', length: 300 })
  question: string;

  // 선택지 텍스트 배열 — 투표는 optionIndex로 참조
  @Column({ type: 'jsonb' })
  options: string[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
