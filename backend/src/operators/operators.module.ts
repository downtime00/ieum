import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Operator } from './entities/operator.entity';
import { OperatorProgram } from './entities/operator-program.entity';
import { ProgramBooking } from './entities/program-booking.entity';
import { OperatorReview } from './entities/operator-review.entity';
import { FamilyMember } from '../family/entities/family-member.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { OperatorsService } from './services/operators.service';
import { BookingsService } from './services/bookings.service';
import { OperatorsController } from './controllers/operators.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Operator, OperatorProgram, ProgramBooking, OperatorReview, FamilyMember]),
    NotificationsModule,
  ],
  controllers: [OperatorsController],
  providers: [OperatorsService, BookingsService],
  exports: [OperatorsService, BookingsService],
})
export class OperatorsModule {}
