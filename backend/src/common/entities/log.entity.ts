import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

@Entity('logs')
export class Log {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: LogLevel })
  level: LogLevel;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  context?: string;

  @Column({ type: 'jsonb', nullable: true })
  meta?: any;

  @Column({ type: 'varchar', length: 50, nullable: true })
  userId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ip?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent?: string;

  @Index()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
