import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Family } from './family.entity';
import { User } from '../../users/entities/user.entity';

export enum MemberRole {
  HEAD = 'HEAD', // 가계원 (장)
  MEMBER = 'MEMBER', // 구성원
}

@Entity('family_members')
export class FamilyMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', nullable: false })
  familyId: number;

  @ManyToOne(() => Family, { cascade: false })
  @JoinColumn({ name: 'family_id' })
  family: Family;

  @Column({ type: 'bigint', nullable: true })
  userId?: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ type: 'varchar', length: 20, default: MemberRole.MEMBER })
  role: MemberRole;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name?: string | null;

  @Column({ type: 'date', nullable: true })
  birthDate?: Date | null;

  @Column({ type: 'text', nullable: true })
  relation?: string | null; // 관계 (배우자, 자녀 등)

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}