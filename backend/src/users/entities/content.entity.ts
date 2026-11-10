import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Organization } from './organization.entity';

export enum ContentType {
  EVENT = 'EVENT', // 행사
  CLASS = 'CLASS', // 교육
  EXHIBITION = 'EXHIBITION', // 전시
  MARKET = 'MARKET', // 마켓
  OTHER = 'OTHER' // 기타
}

export enum ContentTarget {
  ALL_AGE = 'ALL_AGE', // 전 연령
  JUNIOR = 'JUNIOR', // 아이
  SENIOR = 'SENIOR' // 어르신
}

@Entity('contents')
export class Content {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ 
    type: 'jsonb', // 카테고리, 기간, 대상 등을 JSONB 로 저장 (유연성)
    nullable: true 
  })
  attributes?: Record<string, any> | null;

  @Column({ 
    type: 'varchar', 
    length: 255, 
    nullable: true 
  })
  imageUrl?: string | null;

  @Column({ 
    type: 'varchar', 
    length: 2048, 
    nullable: true 
  })
  originalUrl?: string | null;

  @Column({ type: 'timestamptz' })
  publishedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endsAt?: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // Organization 와 관계
  @Column({ type: 'bigint', nullable: true })
  organizationId?: number | null;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization | null;

  // 인덱스 설정 (검색 최적화)
  @Index(['organization_id', 'publishedAt'])
  _composite_index_1: any;

  @Index(['title'])
  _fulltext_title_: any;
}