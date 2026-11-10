import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Content } from '../users/entities/content.entity';
import { RecommendationController } from './controllers/content-recommendation.controller';
import { ContentRecommendationService } from './services/content-recommendation.service';

@Module({
  imports: [TypeOrmModule.forFeature([Content])],
  controllers: [RecommendationController],
  providers: [ContentRecommendationService],
  exports: [ContentRecommendationService],
})
export class RecommendationModule {}