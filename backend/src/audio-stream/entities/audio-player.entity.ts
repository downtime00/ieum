import { Entity, Column, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Audio Player 정보 엔티티 (오디오 스트리밍용)
 */
@Entity()
export class AudioPlayer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  name: string; // 파일명 (예：'user-speech-2024-10-12.mp3')

  @Column({ type: 'int' })
  size: number; // 파일 크기 (바이트)

  @Column()
  duration: number; // 재생 시간 (초)

  @Column({ default: true })
  isPlaying: boolean; // 현재 재생 중 여부

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * 스트림 ID 를 통해 연결하는 키
   */
  streamId: string;
}