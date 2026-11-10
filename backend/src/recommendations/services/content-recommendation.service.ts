import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Content } from '../../users/entities/content.entity';
import { RecommendationDto } from '../dto/recommendation.dto';

@Injectable()
export class ContentRecommendationService {
  constructor(
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
  ) {}

  // 지역별 인기 콘텐츠 추천
  async recommendByArea(areaCode: string): Promise<Content[]> {
    const areaContents = await this.contentRepository
      .createQueryBuilder('content')
      .leftJoinAndSelect('content.organization', 'org')
      .where('org.address LIKE :areaCode', { areaCode: `%${areaCode}%` })
      .orderBy('content.createdAt', 'DESC')
      .take(10)
      .getMany();

    return areaContents;
  }

  // 카테고리별 콘텐츠 추천
  async recommendByCategory(category: string): Promise<Content[]> {
    const categoryContents = await this.contentRepository.find({
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return categoryContents.filter(content => {
      const attributes = content.attributes as Record<string, any>;
      return attributes && attributes[category.toLowerCase()] !== undefined;
    });
  }

  // 유사 키워드를 가진 콘텐츠 추천
  async recommendBySimilarKeywords(keywords: string[]): Promise<Content[]> {
    const keywordArray = Array.isArray(keywords) ? keywords : [keywords];
    const likePattern = `%${keywordArray[0]}%`;
    
    return this.contentRepository.find({
      where: [
        { title: Like(likePattern) },
        { description: Like(likePattern) },
      ],
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }

  // 최근 업데이트된 콘텐츠 추천
  async recommendRecent(): Promise<Content[]> {
    return this.contentRepository.find({
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }

  // 사용자 관심사 기반 추천 (예시 구현)
  async recommendByUserInterests(interests: string[]): Promise<Content[]> {
    if (!interests || interests.length === 0) {
      return this.recommendRecent();
    }

    // 간단한 텍스트 매칭 로직
    const contents = await this.contentRepository.find({});
    
    return contents.filter(content => {
      return interests.some(interest => 
        content.title.includes(interest) || 
        (content.description && content.description.includes(interest))
      );
    }).slice(0, 10);
  }

  // 다양한 추천 알고리즘 통합
  async complexRecommendation({ areaCode, category, keywords }: RecommendationDto): Promise<Content[]> {
    let results: Content[] = [];

    // 우선순위: 지역 > 카테고리 > 키워드 > 최근 업데이트
    
    if (areaCode) {
      results = await this.recommendByArea(areaCode);
    } else if (category) {
      results = await this.recommendByCategory(category);
    } else if (keywords && keywords.length > 0) {
      results = await this.recommendBySimilarKeywords(keywords);
    } else {
      results = await this.recommendRecent();
    }

    return results;
  }
}