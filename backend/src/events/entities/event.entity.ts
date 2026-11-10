import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum EventStatus {
  PENDING = 'PENDING', // 신청 전
  OPEN = 'OPEN',       // 신청 중
  CLOSED = 'CLOSED',   // 신청 마감
  EXPIRED = 'EXPIRED', // 행사 종료
}

export interface EventEntity {
  id: number;
  title: string;
  description?: string;
  imageUrls?: string[];
  startDate: Date;      // 이벤트 시작일 (실제 행사)
  endDate: Date;        // 이벤트 종료일
  visibleFrom?: Date;   // 노출 시작일
  visibleTo?: Date;     // 노출 종료일
  registrationStart?: Date;    // 신청 시작일
  registrationEnd?: Date;      // 신청 마감일
  location?: string;
  organizerName?: string;
  maxParticipants?: number;
  currentParticipants?: number;
  isPublished: boolean;
  status: EventStatus;
  categoryId: number;
  createdAt: Date;
  updatedAt: Date;
}

@Entity('event')
export class Event {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'text', nullable: false })
  title: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('simple-array', { nullable: true })
  imageUrls?: string[];

  @Column('timestamptz')
  startDate: Date;      // 이벤트 시작일 (실제 행사)

  @Column('timestamptz')
  endDate: Date;        // 이벤트 종료일

  /**
   * 노출 시작일 (콘텐츠 관리용)
   */
  @Column('timestamptz', { nullable: true })
  visibleFrom?: Date;

  /**
   * 노출 종료일 (콘텐츠 관리용)
   */
  @Column('timestamptz', { nullable: true })
  visibleTo?: Date;

  /**
   * 신청 시작일 (선택 사항)
   */
  @Column('timestamptz', { nullable: true })
  registrationStart?: Date;

  /**
   * 신청 마감일 (선택 사항)
   */
  @Column('timestamptz', { nullable: true })
  registrationEnd?: Date;

  @Column('text', { nullable: true })
  location?: string;

  @Column('varchar', { nullable: true })
  organizerName?: string;

  @Column({ type: 'int', nullable: true })
  maxParticipants?: number;

  @Column({ type: 'int', default: 0 })
  currentParticipants: number; // 실제 참여자 수

  @Column({ type: 'boolean', default: true })
  isPublished: boolean;

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.OPEN,
  })
  status: EventStatus;

  @Column('int')
  categoryId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
