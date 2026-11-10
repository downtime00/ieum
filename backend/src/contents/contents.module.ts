import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Content } from './entities/content.entity';
import { ContentsController } from './controllers/contents.controller';
import { CultureApiAdapter } from '../data-sources/adapters/culture-api-adapter.service';

@Module({
  imports: [TypeOrmModule.forFeature([Content])],
  controllers: [ContentsController],
  providers: [CultureApiAdapter],
  exports: [TypeOrmModule],
})
export class ContentModule {}
