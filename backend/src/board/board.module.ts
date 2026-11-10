import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FamilyPost } from './entities/family-post.entity';
import { FamilyPostComment } from './entities/family-post-comment.entity';
import { FamilyMember } from '../family/entities/family-member.entity';
import { Family } from '../family/entities/family.entity';
import { BoardService } from './services/board.service';
import { BoardController } from './controllers/board.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FamilyPost, FamilyPostComment, FamilyMember, Family]),
    NotificationsModule,
  ],
  controllers: [BoardController],
  providers: [BoardService],
})
export class BoardModule {}
