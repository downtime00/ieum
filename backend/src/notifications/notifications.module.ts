import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Notification } from './entities/notification.entity';
import { PushSubscription } from './entities/push-subscription.entity';
import { NotificationService } from './services/notification.service';
import { PushService } from './services/push.service';
import { NotificationController } from './controllers/notification.controller';
import { PushController } from './controllers/push.controller';
import { NotificationGateway } from './gateway/notification.gateway';
import { JwtService } from '../auth/jwt.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, PushSubscription]),
    JwtModule.register({}),
  ],
  controllers: [NotificationController, PushController],
  providers: [NotificationService, PushService, NotificationGateway, JwtService],
  exports: [NotificationService, PushService],
})
export class NotificationsModule {}