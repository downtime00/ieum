import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { FamilyInviteCode } from './family-invite-code.entity';

@Entity('families')
export class Family {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text' })
  address?: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone?: string | null;

  // 공개 그룹 여부 (아파트 공지, 동네 모임 등 — 사용자가 검색/가입 가능)
  @Column({ name: 'is_public', type: 'boolean', default: false })
  isPublic: boolean;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  // 댓글 허용 여부 (가족장은 항상, 공개 그룹은 멤버 누구나 변경 가능)
  @Column({ name: 'comments_enabled', type: 'boolean', default: true })
  commentsEnabled: boolean;

  // 초대코드 정보 - TypeORM relation 과 별도 속성 (Service 로직용)
  @Column({ type: 'varchar', length: 10, nullable: true })
  code?: string | null;

  @Column({ type: 'bigint', nullable: true })
  familyId?: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date | null;

  // TypeORM relation - 초대코드 객체
  @OneToOne(() => FamilyInviteCode, ic => ic.familyId)
  @JoinColumn({ name: 'invite_code_id', referencedColumnName: 'id' })
  inviteCode?: FamilyInviteCode;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}