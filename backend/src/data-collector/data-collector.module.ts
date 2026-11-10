import { Module } from '@nestjs/common';
import { DataCollector } from './services/data-collector.service';
import { DataScheduler } from './services/data-scheduler.service';
import { DataCollectorController } from './controllers/data-collector.controller';
import { CultureApiAdapter } from '../data-sources/adapters/culture-api-adapter.service';

@Module({
  controllers: [DataCollectorController],
  providers: [DataCollector, DataScheduler, CultureApiAdapter],
  exports: [DataCollector],
})
export class DataCollectorModule {}
