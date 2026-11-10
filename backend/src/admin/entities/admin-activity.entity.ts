import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum AdminAction {
  // ========== ADMIN 관리 ==================
  CREATE_ADMIN = 'CREATE_ADMIN',
  UPDATE_ADMIN_ROLE = 'UPDATE_ADMIN_ROLE',
  DELETE_ADMIN = 'DELETE_ADMIN',

  // ========== REVIEWER 검수 ==================
  REVIEW_REQUEST_CREATE = 'REVIEW_REQUEST_CREATE',
  REVIEW_REQUEST_APPROVE = 'REVIEW_REQUEST_APPROVE',
  REVIEW_REQUEST_REJECT = 'REVIEW_REQUEST_REJECT',

  // ========== CONTENT 및 EVENT ==================
  CREATE_CONTENT = 'CREATE_CONTENT',
  UPDATE_CONTENT = 'UPDATE_CONTENT',
  DELETE_CONTENT = 'DELETE_CONTENT',
  
  CREATE_EVENT = 'CREATE_EVENT',
  UPDATE_EVENT = 'UPDATE_EVENT',
  DELETE_EVENT = 'DELETE_EVENT',

  APPROVE_CONTENT = 'APPROVE_CONTENT',
  REJECT_CONTENT = 'REJECT_CONTENT',

  // ========== NOTICE 관리 ==================
  CREATE_NOTICE = 'CREATE_NOTICE',
  UPDATE_NOTICE = 'UPDATE_NOTICE',
  DELETE_NOTICE = 'DELETE_NOTICE',

  // ========== ORGANIZATION 관리 ==================
  CREATE_ORGANIZATION = 'CREATE_ORGANIZATION',
  UPDATE_ORGANIZATION = 'UPDATE_ORGANIZATION',
  DELETE_ORGANIZATION = 'DELETE_ORGANIZATION',

  // ========== 그룹 관리 ==================
  CREATE_GROUP = 'CREATE_GROUP',

  // ========== 알림 발송 ==================
  SEND_BULK_NOTIFICATION = 'SEND_BULK_NOTIFICATION',

  // ========== 로그 관리 ==================
  DELETE_LOGS = 'DELETE_LOGS',
  VIEW_LOGS = 'VIEW_LOGS',
  VIEW_DASHBOARD = 'VIEW_DASHBOARD',
}

@Entity('admin_activities')
export class AdminActivity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  adminId: number;

  @Column({ type: 'varchar', length: 100 })
  adminName: string;

  @Column({ type: 'varchar', length: 100 })
  adminEmail: string;

  @Column({
    type: 'enum',
    enum: AdminAction,
  })
  action: AdminAction;

  @Column({ type: 'varchar', length: 50, nullable: true })
  targetType?: string;

  @Column({ type: 'int', nullable: true })
  targetId?: number;

  @Column({ type: 'text', nullable: true })
  targetName?: string;

  @Column({ type: 'jsonb', nullable: true })
  details?: any;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ip?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent?: string;

  @Index()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
