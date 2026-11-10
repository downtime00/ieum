# Data Source

## 개요
외부 API의 데이터를 수집하고 정규화하여 내부 콘텐츠 모델로 변환하는 시스템입니다.

## 데이터 소스

### 1차 데이터 소스 (MVP)
- 문화체육관광부 문화포털 Open API

### 향후 추가 가능
- 서울시 API
- 공공데이터포털 API
- 자치구 API
- 기관 API
- 기관 공개 홈페이지
- 기관 직접 입력

## 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    Scheduler                                │
│              (NestJS Scheduler / Cron)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Data Collector                              │
│          (외부 API 호출 및 데이터 수집)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                DataSourceAdapter                             │
│          (데이터 정규화 및 내부 모델 변환)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │  Culture │ │   Seoul  │ │  Public  │ │  Direct  │      │
│  │   API    │ │   API    │ │   Data   │ │  Input   │      │
│  │ Adapter  │ │ Adapter  │ │ Adapter  │ │ Adapter  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL                                │
│                  (DB Upsert)                                 │
└─────────────────────────────────────────────────────────────┘
```

## DataSourceAdapter 인터페이스

```typescript
interface DataSourceAdapter {
  name: string;
  collect(): Promise<RawContent[]>;
  normalize(raw: RawContent): Promise<NormalizedContent>;
  shouldUpdate(existing: Content, raw: RawContent): boolean;
}

interface RawContent {
  sourceType: string;
  sourceId: string;
  rawData: any;
}

interface NormalizedContent {
  organizationId?: number;
  type: string;
  category: string;
  title: string;
  description: string;
  location: string;
  target: string;
  capacity: number;
  startAt: Date;
  endAt: Date;
  applicationStartAt: Date;
  applicationEndAt: Date;
  sourceUrl: string;
  rawData: any;
}
```

## 문화포털 API Adapter

### 문화포털 API 개요
- 제공자: 문화체육관광부
- 데이터: 문화행사, 공연, 전시, 문화시설, 프로그램 등
- 인증: API Key

### 구현

```typescript
class CultureApiAdapter implements DataSourceAdapter {
  name = 'CULTURE_API';
  private readonly apiKey: string;
  private readonly baseUrl = 'https://www.culture.go.kr';

  constructor() {
    this.apiKey = process.env.CULTURE_API_KEY;
  }

  async collect(): Promise<RawContent[]> {
    const rawContents: RawContent[] = [];

    // 문화행사 데이터 수집
    const events = await this.fetchEvents();
    rawContents.push(...events);

    // 공연 데이터 수집
    const performances = await this.fetchPerformances();
    rawContents.push(...performances);

    // 전시 데이터 수집
    const exhibitions = await this.fetchExhibitions();
    rawContents.push(...exhibitions);

    return rawContents;
  }

  private async fetchEvents(): Promise<RawContent[]> {
    const response = await axios.get(
      `${this.baseUrl}/openapi/rest/public/cultureFestival`,
      {
        params: {
          apiKey: this.apiKey,
          pageNo: 1,
          numOfRows: 100,
        },
      },
    );

    const items = response.data.response.body.items.item;

    return items.map((item: any) => ({
      sourceType: 'CULTURE_API',
      sourceId: item.cultcode,
      rawData: item,
    }));
  }

  private async fetchPerformances(): Promise<RawContent[]> {
    const response = await axios.get(
      `${this.baseUrl}/openapi/rest/public/performances`,
      {
        params: {
          apiKey: this.apiKey,
          pageNo: 1,
          numOfRows: 100,
        },
      },
    );

    const items = response.data.response.body.items.item;

    return items.map((item: any) => ({
      sourceType: 'CULTURE_API',
      sourceId: item.mt20id,
      rawData: item,
    }));
  }

  private async fetchExhibitions(): Promise<RawContent[]> {
    const response = await axios.get(
      `${this.baseUrl}/openapi/rest/public/exhibitions`,
      {
        params: {
          apiKey: this.apiKey,
          pageNo: 1,
          numOfRows: 100,
        },
      },
    );

    const items = response.data.response.body.items.item;

    return items.map((item: any) => ({
      sourceType: 'CULTURE_API',
      sourceId: item.seq,
      rawData: item,
    }));
  }

  async normalize(raw: RawContent): Promise<NormalizedContent> {
    const data = raw.rawData;

    // 기관 매칭
    const organization = await this.matchOrganization(data);

    return {
      organizationId: organization?.id,
      type: this.mapContentType(data),
      category: this.mapCategory(data),
      title: data.title || data.cultnm || data.prfnm || data.exhnm,
      description: data.description || data.cultdesc || data.prfnote || data.exhdesc,
      location: data.place || data.fclty || data.loctn,
      target: data.target || data.trgtseg,
      capacity: data.capacity || data.seatcnt,
      startAt: this.parseDate(data.startdate || data.prfpdfrom || data.exhstrdt),
      endAt: this.parseDate(data.enddate || data.prfpdto || data.exhenddt),
      applicationStartAt: this.parseDate(data.applystart || data.prfopen),
      applicationEndAt: this.parseDate(data.applyend || data.prfclose),
      sourceUrl: data.url || data.href || data.homepage,
      rawData: data,
    };
  }

  shouldUpdate(existing: Content, raw: RawContent): boolean {
    // 데이터 변경 여부 확인
    const existingRaw = existing.rawData as any;
    const newRaw = raw.rawData;

    return (
      existingRaw.title !== newRaw.title ||
      existingRaw.startdate !== newRaw.startdate ||
      existingRaw.enddate !== newRaw.enddate
    );
  }

  private async matchOrganization(data: any): Promise<Organization | null> {
    // 장소/기관명으로 기관 매칭
    const placeName = data.place || data.fclty || data.facilityName;

    if (!placeName) return null;

    return this.organizationRepository.findOne({
      where: { name: ILike(`%${placeName}%`) },
    });
  }

  private mapContentType(data: any): string {
    if (data.cultcode) return 'EVENT';
    if (data.mt20id) return 'PERFORMANCE';
    if (data.seq) return 'EXHIBITION';
    return 'ETC';
  }

  private mapCategory(data: any): string {
    // 데이터의 카테고리를 내부 카테고리로 매핑
    const categoryMap: Record<string, string> = {
      '문화행사': '지역행사',
      '공연': '공연',
      '전시': '전시',
      '교육': '교육',
      '체육': '운동',
    };

    const sourceCategory = data.category || data.genrenm || data.kname;
    return categoryMap[sourceCategory] || '기타';
  }

  private parseDate(dateStr: string): Date {
    if (!dateStr) return null;
    return new Date(dateStr);
  }
}
```

## Data Collector

```typescript
class DataCollector {
  constructor(
    private readonly adapters: DataSourceAdapter[],
    private readonly contentRepository: ContentRepository,
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async collectAll(): Promise<void> {
    for (const adapter of this.adapters) {
      try {
        await this.collect(adapter);
      } catch (error) {
        console.error(`Error collecting from ${adapter.name}:`, error);
        // 개별 어댑터 에러는 전체 수집을 중단하지 않음
      }
    }
  }

  private async collect(adapter: DataSourceAdapter): Promise<void> {
    console.log(`Collecting data from ${adapter.name}...`);

    // 원본 데이터 수집
    const rawContents = await adapter.collect();

    for (const raw of rawContents) {
      await this.processRawContent(adapter, raw);
    }

    console.log(`Collected ${rawContents.length} items from ${adapter.name}`);
  }

  private async processRawContent(
    adapter: DataSourceAdapter,
    raw: RawContent,
  ): Promise<void> {
    // 기존 콘텐츠 확인
    const existing = await this.contentRepository.findOne({
      where: {
        sourceType: raw.sourceType,
        sourceId: raw.sourceId,
      },
    });

    if (existing) {
      // 업데이트 필요 여부 확인
      if (adapter.shouldUpdate(existing, raw)) {
        const normalized = await adapter.normalize(raw);
        await this.contentRepository.save({
          ...existing,
          ...normalized,
          updatedAt: new Date(),
        });
      }
    } else {
      // 새로운 콘텐츠 생성
      const normalized = await adapter.normalize(raw);
      const content = this.contentRepository.create({
        ...normalized,
        sourceType: raw.sourceType,
        sourceId: raw.sourceId,
        collectedAt: new Date(),
      });
      await this.contentRepository.save(content);
    }
  }
}
```

## Scheduler

```typescript
@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [DataCollector, CultureApiAdapter],
})
class DataSourceModule {
  constructor(private readonly schedulerRegistry: SchedulerRegistry) {
    this.registerScheduler();
  }

  private registerScheduler(): void {
    // 매시간 데이터 수집
    const job = CronJob.fromCron({
      cronTime: '0 * * * *',
      onTick: async () => {
        await this.dataCollector.collectAll();
      },
    });

    this.schedulerRegistry.addCronJob('data-collection', job);
    job.start();
  }
}
```

## 데이터 소스 관리

### Data Source 테이블

```sql
CREATE TABLE data_sources (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    provider VARCHAR(100),
    api_url TEXT,
    license TEXT,
    commercial_use BOOLEAN,
    redistribution_allowed BOOLEAN,
    attribution_required BOOLEAN,
    source_url TEXT,
    last_synced_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 데이터 소스 정보 관리

```typescript
class DataSourceService {
  async updateLastSynced(sourceType: string): Promise<void> {
    await this.dataSourceRepository.update(
      { name: sourceType },
      { lastSyncedAt: new Date() },
    );
  }

  async getLicenseInfo(sourceType: string): Promise<LicenseInfo> {
    const source = await this.dataSourceRepository.findOne({
      where: { name: sourceType },
    });

    return {
      license: source.license,
      commercialUse: source.commercialUse,
      redistributionAllowed: source.redistributionAllowed,
      attributionRequired: source.attributionRequired,
      sourceUrl: source.sourceUrl,
    };
  }
}
```

## 중복 방지

### Unique 제약조건

```sql
CONSTRAINT uq_content_source
UNIQUE (source_type, source_id)
```

### Upsert 로직

```typescript
async upsertContent(normalized: NormalizedContent): Promise<Content> {
  const existing = await this.contentRepository.findOne({
    where: {
      sourceType: normalized.sourceType,
      sourceId: normalized.sourceId,
    },
  });

  if (existing) {
    return this.contentRepository.save({
      ...existing,
      ...normalized,
      updatedAt: new Date(),
    });
  } else {
    const content = this.contentRepository.create({
      ...normalized,
      collectedAt: new Date(),
    });
    return this.contentRepository.save(content);
  }
}
```

## 에러 처리

### 외부 API 장애 대응

```typescript
class DataCollector {
  private async collect(adapter: DataSourceAdapter): Promise<void> {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        await this.collectWithRetry(adapter);
        return;
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) {
          console.error(`Failed to collect from ${adapter.name} after ${maxRetries} retries`);
          // 에러 로깅 및 모니터링
          await this.logError(adapter.name, error);
          return;
        }
        await this.delay(1000 * retryCount); // Exponential backoff
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 데이터 유효성 검증

```typescript
class DataValidator {
  validateRawContent(raw: RawContent): boolean {
    // 필수 필드 확인
    if (!raw.sourceType || !raw.sourceId) {
      return false;
    }

    // 데이터 구조 확인
    if (!raw.rawData) {
      return false;
    }

    return true;
  }

  validateNormalizedContent(content: NormalizedContent): boolean {
    // 필수 필드 확인
    if (!content.title || !content.type) {
      return false;
    }

    // 날짜 유효성 확인
    if (content.startAt && content.endAt) {
      if (content.startAt > content.endAt) {
        return false;
      }
    }

    return true;
  }
}
```

## 확장성

### 새로운 데이터 소스 추가

1. `DataSourceAdapter` 인터페이스 구현
2. `DataCollector`에 어댑터 등록
3. `data_sources` 테이블에 메타데이터 추가
4. 환경변수 설정 (API Key 등)

```typescript
class SeoulApiAdapter implements DataSourceAdapter {
  name = 'SEOUL_API';
  // 구현...
}

// 등록
const adapters = [
  new CultureApiAdapter(),
  new SeoulApiAdapter(),
  // 새로운 어댑터 추가
];
```

## 모니터링

### 수집 로그

```typescript
class CollectionLogger {
  async logCollection(sourceType: string, count: number, error?: Error): Promise<void> {
    await this.collectionLogRepository.save({
      sourceType,
      count,
      error: error?.message,
      collectedAt: new Date(),
    });
  }

  async getCollectionStats(sourceType: string): Promise<CollectionStats> {
    const logs = await this.collectionLogRepository.find({
      where: { sourceType },
      order: { collectedAt: 'DESC' },
      take: 30,
    });

    return {
      totalCollected: logs.reduce((sum, log) => sum + log.count, 0),
      errorCount: logs.filter(log => log.error).length,
      lastCollectedAt: logs[0]?.collectedAt,
    };
  }
}
```

## 환경변수

```env
CULTURE_API_KEY=
SEOUL_API_KEY=
PUBLIC_DATA_API_KEY=
```

## 이용약관 및 라이선스

각 데이터 소스의 이용조건을 확인하고 준수합니다.

- 상업적 사용 여부
- 재배포 허용 여부
- 출처 표시 필요 여부

필요한 경우 사용자에게 원본 출처와 원문 URL을 표시합니다.
