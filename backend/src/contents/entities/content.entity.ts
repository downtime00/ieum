import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ContentType {
  GENERAL = 'GENERAL',
  EVENT = 'EVENT',
  NOTICE = 'NOTICE',
  PROGRAM = 'PROGRAM',
}

export interface ContentEntity {
  id: number;
  title: string;
  description?: string;
  contentUrl: string;
  thumbnailUrl?: string;
  categoryId: number;
  views: number;
  isPublished: boolean;
  contentType?: ContentType;
  eventDate?: Date;
  maxParticipants?: number;
  currentParticipants?: number;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Entity('content')
export class Content {
  @PrimaryGeneratedColumn('increment')
  id: number;

  /**
   * 외부 문화정보 API 일련번호 (중복 수집 방지용)
   */
  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  contentsn?: string | null;

  /**
   * 지역 코드/명 (예: 서울 관악구)
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  areaCode?: string | null;

  /**
   * 분류 (예: 연극, 전시)
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  categoryCd?: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  latitude?: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  longitude?: number | null;

  @Column({ type: 'text', nullable: false })
  title: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({ type: 'varchar' })
  contentUrl: string;

  @Column('varchar', { nullable: true })
  thumbnailUrl?: string;

  @Column({ type: 'int', default: 0 })
  views: number;

  @Column({ type: 'boolean', default: true })
  isPublished: boolean;

  @Column({
    type: 'enum',
    enum: ContentType,
    default: ContentType.GENERAL,
  })
  contentType: ContentType;

  /**
   * 이벤트 시작일 (EVENT 타입 전용)
   */
  @Column('timestamptz', { nullable: true })
  startDate?: Date;

  /**
   * 이벤트 종료일 (EVENT 타입 전용)
   */
  @Column('timestamptz', { nullable: true })
  endDate?: Date;

  /**
   * 노출 시작일 (모든 타입 - 언제부터 노출될지)
   */
  @Column('timestamptz', { nullable: true })
  visibleFrom?: Date;

  /**
   * 노출 종료일 (모든 타입 - 언제까지 노출될지)
   */
  @Column('timestamptz', { nullable: true })
  visibleTo?: Date;

  @Column('timestamptz', { nullable: true })
  eventDate?: Date; // deprecated: startDate -> endDate 로 대체 예정

  @Column({ type: 'int', nullable: true })
  maxParticipants?: number;

  @Column({ type: 'int', default: 0 })
  currentParticipants: number;

  @Column('varchar', { nullable: true })
  location?: string;

  @Column({ type: 'boolean', default: false, nullable: true })
  isApproved?: boolean; // REVIEWER 승인 여부

  /**
   * 무료 여부 (detail2 가격 기준 — 상세 조회 시 백필)
   */
  @Column({ type: 'boolean', nullable: true })
  isFree?: boolean | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * 검수자 ID (승인한 리뷰어)
   */
  @Column({ type: 'int', nullable: true })
  reviewedBy?: number; // Reviewer가 승인한 경우 사용됨
}
