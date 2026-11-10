import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

export enum SocialAuthProvider {
  KAKAO = 'KAKAO',
  NAVER = 'NAVER',
  GOOGLE = 'GOOGLE'
}

@Entity('user_social_accounts')
export class UserSocialAccounts {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', nullable: false })
  userId: number;

  @ManyToOne(() => User)
  user: User;

  @Column({ type: 'varchar', length: 20, nullable: false })
  provider: SocialAuthProvider;

  @Column({ type: 'varchar', length: 255, nullable: false })
  providerUserId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  profileName?: string | null;

  @Column({ type: 'text', nullable: true })
  profileImage?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}