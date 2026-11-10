import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Content, ContentType } from '../../contents/entities/content.entity';
import { CultureApiAdapter } from '../../data-sources/adapters/culture-api-adapter.service';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class DataCollector implements OnModuleInit, OnModuleDestroy {
  private contentRepository: Repository<Content>;

  constructor(
    private readonly dataSource: DataSource,
    private readonly cultureApiAdapter: CultureApiAdapter,
    private readonly redis: RedisService,
  ) {}

  onModuleInit() {
    this.contentRepository = this.dataSource.getRepository(Content);
    console.log('[DataCollector] 모듈이 초기화되었습니다');
  }

  async onModuleDestroy() {
    console.log('[DataCollector] 모듈이 종료되었습니다');
  }

  async collectContent(
    filters: {
      areaCode?: string;
      categoryCd?: string;
      keyword?: string;
    },
    page = 1,
    limit = 50,
  ): Promise<number> {
    console.log(`[DataCollector] 수집 시작: ${JSON.stringify(filters)}`);

    try {
      const contentList = filters.areaCode
        ? await this.cultureApiAdapter.getContentListByArea(page, limit, filters)
        : await this.cultureApiAdapter.getContentList(page, limit, filters);

      if (!contentList || contentList.length === 0) {
        console.log('[DataCollector] 수집할 콘텐츠가 없습니다');
        return 0;
      }

      const existingIds = await this.getExistingContentSnSet();
      const newContents = contentList.filter(
        (c: any) => c.contentsn && !existingIds.has(c.contentsn),
      );

      if (newContents.length === 0) {
        console.log('[DataCollector] 새로운 콘텐츠가 없습니다');
        return 0;
      }

      const entities = newContents.map((item: any) => this.toEntity(item));
      const saved = await this.contentRepository.save(entities);
      await this.redis.delPattern('contents:*');
      console.log(`[DataCollector] ${saved.length} 개의 콘텐츠를 DB 에 저장했습니다`);

      return saved.length;
    } catch (error) {
      console.error('[DataCollector] 수집 중 오류:', error);
      throw error;
    }
  }

  private toEntity(item: any): Partial<Content> {
    const eventDate = this.parseStartDate(item.eventDate);
    return {
      contentsn: item.contentsn ?? null,
      title: item.title || '제목 없음',
      description: item.summary || undefined,
      contentUrl: item.contentLink || item.placeUrl || '',
      thumbnailUrl: item.thumbnail || undefined,
      contentType: ContentType.EVENT,
      eventDate,
      startDate: eventDate ?? undefined,
      location: item.locationName || item.areaCode || undefined,
      areaCode: item.areaCode ?? null,
      categoryCd: item.categoryCd ?? null,
      latitude: item.latitude ?? null,
      longitude: item.longitude ?? null,
      isPublished: true,
    };
  }

  private parseStartDate(eventDate?: string): Date | undefined {
    if (!eventDate) return undefined;
    // "YYYY-MM-DD ~ YYYY-MM-DD" 형식에서 시작일만 추출
    const start = eventDate.split('~')[0].trim();
    const date = new Date(start);
    return isNaN(date.getTime()) ? undefined : date;
  }

  private async getExistingContentSnSet(): Promise<Set<string>> {
    const rows = await this.contentRepository
      .createQueryBuilder('content')
      .select('content.contentsn', 'contentsn')
      .where('content.contentsn IS NOT NULL')
      .getRawMany();

    return new Set(rows.map((row: any) => String(row.contentsn)));
  }

  async collectMultipleAreas(areas: string[]): Promise<{ areaCode: string; count: number }[]> {
    const results = [];

    for (const areaCode of areas) {
      try {
        const count = await this.collectContent({ areaCode });
        if (count > 0) {
          results.push({ areaCode, count });
        }
      } catch (error) {
        console.error(`[DataCollector] 지역 ${areaCode} 수집 실패:`, error);
      }
    }

    return results;
  }
}
