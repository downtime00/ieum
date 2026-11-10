import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Content } from '../../contents/entities/content.entity';

export enum ParticipationStatus {
  REGISTERED = 'REGISTERED',
  ATTENDED = 'ATTENDED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

@Entity('event_participation')
export class EventParticipation {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'int', nullable: false })
  userId: number;

  @Column({ type: 'int', nullable: false })
  contentId: number;

  @Column({
    type: 'enum',
    enum: ParticipationStatus,
    default: ParticipationStatus.REGISTERED,
  })
  status: ParticipationStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'int', default: 0 })
  participantsCount: number;

  @CreateDateColumn({ type: 'timestamptz' })
  registeredAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Content)
  @JoinColumn({ name: 'contentId' })
  content: Content;
}
