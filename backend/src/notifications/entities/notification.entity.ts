import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: false })
  body: string;

  @Column({ type: 'boolean', default: true, name: 'is_read' })
  isRead: boolean;

  @Column({ type: 'varchar', length: 50, nullable: false })
  type: 'INFO' | 'ANNOUNCEMENT' | 'ALERT' | 'CONTENT' | 'FAMILY';

  @Column({ type: 'bigint', nullable: true })
  userId?: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  vapidPublicKey?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'text', nullable: true })
  payload?: string | null; // 추가 정보 JSON
}