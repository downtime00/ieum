import { Entity, Column, CreateDateColumn, UpdateDateColumn, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('notices')
export class Notice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: false })
  @Index()
  title: string; // 제목

  @Column({ type: 'text', nullable: true })
  content: string; // 본문 내용

  @Column({ type: 'enum', enum: ['public', 'private'], default: 'public' })
  scope: 'public' | 'private'; // 공개/기관별 공지

  @Column({ type: 'uuid', nullable: true })
  organizationId?: string; // 관련 기관 ID (null 이면 전체 공지)

  @Column({ type: 'bool', default: false })
  isPinned: boolean; // 고정된 공지 여부

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
