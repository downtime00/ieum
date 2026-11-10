import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('family_post_comments')
export class FamilyPostComment {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index()
  @Column({ name: 'post_id', type: 'bigint' })
  postId: string;

  @Column({ name: 'author_user_id', type: 'bigint' })
  authorUserId: number;

  @Column({ name: 'author_name', type: 'varchar', length: 100 })
  authorName: string;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
