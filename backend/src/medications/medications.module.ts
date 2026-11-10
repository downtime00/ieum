import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Medication } from './entities/medication.entity';
import { MedicationReminderLog } from './entities/medication-reminder-log.entity';
import { MedicationsService } from './services/medications.service';
import { MedicationReminderScheduler } from './services/medication-reminder.scheduler';
import { MedicationsController } from './controllers/medications.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { Notification } from '../notifications/entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Medication, MedicationReminderLog, Notification]),
    NotificationsModule,
  ],
  controllers: [MedicationsController],
  providers: [MedicationsService, MedicationReminderScheduler],
  exports: [MedicationsService],
})
export class MedicationsModule {}
