import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notice } from './notice.entity';
import { AdminActivity } from './entities/admin-activity.entity';
import { AdminService } from './services/admin.service';
import { AdminController } from './controllers/admin.controller';
import { Content } from '../contents/entities/content.entity';
import { EventParticipation } from '../events/entities/event-participation.entity';
import { Event } from '../events/entities/event.entity';
import { User } from '../users/entities/user.entity';
import { Family } from '../family/entities/family.entity';
import { FamilyMember } from '../family/entities/family-member.entity';
import { OrganizationsModule } from '../organizations/organizations.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notice, AdminActivity, Content, EventParticipation, Event, User, Family, FamilyMember]),
    OrganizationsModule,
    NotificationsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}