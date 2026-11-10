import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('family_posts')
export class FamilyPost {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'family_id', type: 'bigint' })
  familyId: number;

  @Column({ name: 'author_user_id', type: 'bigint' })
  authorUserId: number;

  @Column({ name: 'author_name', type: 'varchar', length: 100 })
  authorName: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'is_notice', type: 'boolean', default: false })
  isNotice: boolean;

  // 공개 그룹 게시글 노출 시작일 (null이면 즉시 노출)
  @Column({ name: 'visible_from', type: 'timestamptz', nullable: true })
  visibleFrom: Date | null;

  // 공개 그룹 게시글 노출 종료일 — 이 날짜 이후 목록에서 숨김
  @Column({ name: 'visible_until', type: 'timestamptz', nullable: true })
  visibleUntil: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
