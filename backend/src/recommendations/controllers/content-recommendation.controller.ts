import { Controller, Get, Query, Param } from '@nestjs/common';
import { ContentRecommendationService } from '../services/content-recommendation.service';
import { Content } from '../../users/entities/content.entity';

@Controller('recommendations')
export class RecommendationController {
  constructor(
    private readonly recommendationService: ContentRecommendationService,
  ) {}

  @Get()
  async recommend(
    @Query('areaCode') areaCode?: string,
    @Query('category') category?: string,
    @Query('keywords') keywords?: string,
  ): Promise<Content[]> {
    const keywordArray = keywords ? keywords.split(',').filter(Boolean) : undefined;

    return this.recommendationService.complexRecommendation({
      areaCode,
      category,
      keywords: keywordArray,
    });
  }

  @Get('area/:areaCode')
  async recommendByArea(@Param('areaCode') areaCode: string): Promise<Content[]> {
    return this.recommendationService.recommendByArea(areaCode);
  }

  @Get('category/:category')
  async recommendByCategory(@Param('category') category: string): Promise<Content[]> {
    return this.recommendationService.recommendByCategory(category);
  }

  @Get('keywords/:...keywords')
  async recommendByKeywords(
    @Param() param: any,
  ): Promise<Content[]> {
    const keywords = param.keywords;
    return this.recommendationService.recommendBySimilarKeywords(keywords.split(','));
  }

  @Get('recent')
  async recommendRecent(): Promise<Content[]> {
    return this.recommendationService.recommendRecent();
  }
}