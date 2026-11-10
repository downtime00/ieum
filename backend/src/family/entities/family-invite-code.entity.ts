import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('family_invite_codes')
export class FamilyInviteCode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 10, unique: true })
  code: string; // 예：AB12XY

  @Column({ type: 'bigint', nullable: false })
  familyId: number;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date | null; // 만료일 (null = 영구 유효)

  @CreateDateColumn()
  createdAt: Date;
}