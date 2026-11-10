import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_interests')
export class UserInterests {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', nullable: false })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category?: string | null; // 문화, 복지, 교육 등 카테고리

  @Column({ type: 'text', nullable: true })
  interest?: string | null; // 구체적인 관심사 (예："도서관", "복지센터", "노인대학")

  @Column({ type: 'timestamptz' })
  createdAt: Date;
}