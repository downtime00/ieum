import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventParticipationController } from './controllers/event-participation.controller';
import { EventParticipationService } from './services/event-participation.service';
import { EventParticipation } from './entities/event-participation.entity';
import { Event } from './entities/event.entity';
import { Content } from '../contents/entities/content.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventParticipation, Content, User, Event]),
  ],
  controllers: [EventParticipationController],
  providers: [EventParticipationService],
  exports: [EventParticipationService],
})
export class EventsModule {}
