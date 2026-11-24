import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';

@Entity('family_poll_votes')
@Unique(['pollId', 'userId'])
export class FamilyPollVote {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'poll_id', type: 'bigint' })
  pollId: number;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  // family_polls.options 배열의 인덱스
  @Column({ name: 'option_index', type: 'int' })
  optionIndex: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
