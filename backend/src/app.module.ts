import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ContentModule } from './contents/contents.module';
import { DataCollectorModule } from './data-collector/data-collector.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FamilyModule } from './family/family.module';
import { AdminModule } from './admin/admin.module';
import { EventsModule } from './events/events.module';
import { LogsModule } from './logs/logs.module';
import { LocationModule } from './location/location.module';
import { MedicationsModule } from './medications/medications.module';
import { BoardModule } from './board/board.module';
import { OperatorsModule } from './operators/operators.module';
import { FamilyPost } from './board/entities/family-post.entity';
import { FamilyPostComment } from './board/entities/family-post-comment.entity';
import { HealthController } from './common/controllers/health.controller';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

// Users 모듈 엔티티
import { User } from './users/entities/user.entity';
import { UserSocialAccount } from './users/entities/user-social-account.entity';
import { UserProfile } from './users/entities/user-profile.entity';
import { UserInterest } from './users/entities/user-interest.entity';
import { RefreshToken } from './users/entities/refresh-token.entity';

// Organizations 모듈 엔티티
import { Organization } from './organizations/entities/organization.entity';
import { UserOrganization } from './organizations/entities/user-organization.entity';

// 기타 모듈 엔티티
import { Content } from './contents/entities/content.entity';
import { Notification } from './notifications/entities/notification.entity';
import { PushSubscription } from './notifications/entities/push-subscription.entity';
import { Medication } from './medications/entities/medication.entity';
import { MedicationReminderLog } from './medications/entities/medication-reminder-log.entity';
import { Family } from './family/entities/family.entity';
import { FamilyMember } from './family/entities/family-member.entity';
import { FamilyInviteCode } from './family/entities/family-invite-code.entity';
import { Notice } from './admin/notice.entity';
import { AdminActivity } from './admin/entities/admin-activity.entity';
import { Event } from './events/entities/event.entity';
import { EventParticipation } from './events/entities/event-participation.entity';
import { Log } from './common/entities/log.entity';
import { Operator } from './operators/entities/operator.entity';
import { OperatorProgram } from './operators/entities/operator-program.entity';
import { ProgramBooking } from './operators/entities/program-booking.entity';
import { OperatorReview } from './operators/entities/operator-review.entity';
import { RedisModule } from './common/redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      ...(process.env.DATABASE_URL
        ? { url: process.env.DATABASE_URL }
        : {
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '5432', 10),
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
          }),
      ssl:
        process.env.DB_SSL === 'true' ||
        (process.env.DATABASE_URL?.includes('supabase') ?? false)
          ? { rejectUnauthorized: false }
          : false,
      entities: [
        User,
        UserSocialAccount,
        UserProfile,
        UserInterest,
        RefreshToken,
        Organization,
        UserOrganization,
        Content,
        Notification,
        PushSubscription,
        Medication,
        MedicationReminderLog,
        FamilyPost,
        FamilyPostComment,
        Family,
        FamilyMember,
        FamilyInviteCode,
        Notice,
        AdminActivity,
        Event,
        EventParticipation,
        Log,
        Operator,
        OperatorProgram,
        ProgramBooking,
      OperatorReview,
      ],
      // 개발 환경에서는 synchronize 사용 (마이그레이션 미비 시 자동 스키마 생성)
      // 프로덕션에서는 반드시 false + 마이그레이션 사용
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    OrganizationsModule,
    UsersModule,
    AuthModule,
    ContentModule,
    DataCollectorModule,
    NotificationsModule,
    FamilyModule,
    AdminModule,
    EventsModule,
    LogsModule,
    LocationModule,
    MedicationsModule,
    BoardModule,
    OperatorsModule,
    RedisModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
