import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_profiles')
export class UserProfiles {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', nullable: false, unique: true })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 255, nullable: true })
  profileUrl?: string | null;

  @Column({ type: 'text', nullable: true })
  bio?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  additionalInfo?: Record<string, any> | null;

  @Column({ type: 'timestamptz' })
  createdAt: Date;
}