import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ContentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

@Entity('content')
export class Content {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  contentsn: string | null; // 문화포털 콘텐츠 시퀀스

  @Column({ type: 'text', nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  areaCode: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  categoryCd: string | null;

  @Column({ type: 'text', nullable: true })
  contentLink: string | null;

  @Column({ type: 'date', nullable: true })
  eventDate?: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  locationName: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  latitude?: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  longitude?: number | null;

  @Column({ type: 'varchar', length: 50, default: ContentStatus.ACTIVE, nullable: false })
  status: ContentStatus;

  @Column({ type: 'numeric', nullable: true })
  viewCount?: number | null;

  @Column({ type: 'timestamptz' })
  registerDate: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // 외부 API 에서 가져온 날짜 (마감일 등)
  @Column({ type: 'timestamptz', nullable: true })
  applicationDeadline?: Date | null;
}