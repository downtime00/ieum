import { Controller, Get, Param, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Content } from '../entities/content.entity';
import { RedisService } from '../../common/redis/redis.service';
import { CultureApiAdapter } from '../../data-sources/adapters/culture-api-adapter.service';

const CACHE_TTL = 600; // 10분

@Controller('contents')
export class ContentsController {
  constructor(
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
    private readonly redis: RedisService,
    private readonly cultureApi: CultureApiAdapter,
  ) {}

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('keyword') keyword?: string,
    @Query('area') area?: string,
    @Query('category') category?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radius') radius?: string,
    @Query('sort') sort?: string,
    @Query('free') free?: string,
    @Query('upcoming') upcoming?: string,
  ) {
    const byDistance = lat != null && lng != null;
    const cacheKey = `contents:list:${page}:${limit}:${keyword || ''}:${area || ''}:${category || ''}:${byDistance ? `${lat},${lng},${radius || ''}` : ''}:${sort || ''}:${free || ''}:${upcoming || ''}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const qb = this.contentRepository
      .createQueryBuilder('content')
      .where('content.isPublished = true');

    if (byDistance) {
      const latNum = Number(lat);
      const lngNum = Number(lng);

      // Haversine 공식으로 거리(km) 계산 (좌표 없는 항목 제외)
      qb.andWhere('content.latitude IS NOT NULL AND content.longitude IS NOT NULL')
        .addSelect(
          `(6371 * acos(LEAST(1, cos(radians(${latNum})) * cos(radians("content"."latitude"::float)) * cos(radians("content"."longitude"::float) - radians(${lngNum})) + sin(radians(${latNum})) * sin(radians("content"."latitude"::float)))))`,
          'distance',
        )
        .orderBy('distance', 'ASC');

      const radiusKm = radius ? Number(radius) : null;
      if (radiusKm && !isNaN(radiusKm)) {
        qb.andWhere(
          `(6371 * acos(LEAST(1, cos(radians(${latNum})) * cos(radians("content"."latitude"::float)) * cos(radians("content"."longitude"::float) - radians(${lngNum})) + sin(radians(${latNum})) * sin(radians("content"."latitude"::float))))) <= ${radiusKm}`,
        );
      }
    } else if (sort === 'price') {
      // 가격순: 무료 → 미확인 → 유료 순 (실제 금액 데이터는 없고 isFree 기준)
      qb.addSelect(
        `CASE WHEN "content"."isFree" IS TRUE THEN 0 WHEN "content"."isFree" IS NULL THEN 1 ELSE 2 END`,
        'price_rank',
      )
        .orderBy('price_rank', 'ASC')
        .addOrderBy('content.eventDate', 'DESC', 'NULLS LAST')
        .addOrderBy('content.createdAt', 'DESC');
    } else {
      // 일자순(빠른 순): 다가오는 날짜 먼저 → 지난 날짜 → 날짜 없음 순
      qb.addSelect(
        `CASE WHEN content.eventDate IS NULL OR content.eventDate < :now THEN 1 ELSE 0 END`,
        'date_rank',
      )
        .setParameter('now', new Date())
        .orderBy('date_rank', 'ASC')
        .addOrderBy('content.eventDate', 'ASC', 'NULLS LAST')
        .addOrderBy('content.createdAt', 'DESC');
    }

    if (keyword) {
      qb.andWhere('(content.title ILIKE :kw OR content.description ILIKE :kw OR content.location ILIKE :kw)', {
        kw: `%${keyword}%`,
      });
    }
    if (area) {
      qb.andWhere('content.areaCode ILIKE :area', { area: `%${area}%` });
    }
    if (category) {
      qb.andWhere('content.categoryCd = :category', { category });
    }
    if (free === 'true') {
      qb.andWhere('content.isFree = true');
    } else if (free === 'false') {
      qb.andWhere('content.isFree = false');
    }
    if (upcoming === 'true') {
      // 아직 끝나지 않은 행사만: 종료일/행사일이 없으면 날짜 미상 정보로 포함
      qb.andWhere(
        `((content.endDate IS NOT NULL AND content.endDate >= :now)
          OR (content.endDate IS NULL AND (content.eventDate IS NULL OR content.eventDate >= :now)))`,
        { now: new Date() },
      );
    }

    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const result = { items, total, page, limit };
    await this.redis.set(cacheKey, JSON.stringify(result), CACHE_TTL);

    return result;
  }

  /**
   * 상세 조회 + 한국문화정보원 /detail2 실시간 보강 (가격, 전화번호, 주소 등)
   */
  @Get(':id/detail')
  async findDetail(@Param('id', ParseIntPipe) id: number) {
    const cacheKey = `contents:detail:${id}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const content = await this.contentRepository.findOne({ where: { id } });
    if (!content) return null;

    const result: any = { ...content };
    let apiEventDate: string | undefined;

    if (content.contentsn) {
      try {
        const detail = await this.cultureApi.getContentDetail(content.contentsn);
        if (detail) {
          apiEventDate = detail.eventDate;
          result.detail = {
            price: detail.reservationInfo,
            phone: detail.phone,
            address: detail.placeAddr,
            placeUrl: detail.placeUrl,
            locationName: detail.locationName,
            thumbnail: detail.thumbnail,
            url: detail.contentLink,
          };
        }
      } catch {
        // 외부 API 실패 시 DB 정보만 반환
      }
    }

    // 무료 여부 판정 후 DB에 백필 (목록 배지용)
    const price = result.detail?.price;
    if (price != null && content.isFree == null) {
      const isFree = this.isFreePrice(price);
      content.isFree = isFree;
      this.contentRepository.update({ id: content.id }, { isFree }).catch(() => {});
      result.isFree = isFree;
    } else if (content.isFree != null) {
      result.isFree = content.isFree;
    }

    // 이벤트 기간 종료일까지 캐시 유지 (없으면 1시간, 최대 30일)
    const ttl = this.detailCacheTtl(content, apiEventDate);
    await this.redis.set(cacheKey, JSON.stringify(result), ttl);
    return result;
  }

  /**
   * 상세 캐시 TTL: 이벤트 종료일(KST 자정)까지의 초 단위 TTL
   */
  private detailCacheTtl(content: Content, apiEventDate?: string): number {
    const MIN_TTL = 300; // 5분
    const DEFAULT_TTL = 3600; // 1시간
    const MAX_TTL = 30 * 24 * 3600; // 최대 30일

    // /detail2의 eventDate("YYYY-MM-DD ~ YYYY-MM-DD") 종료일
    const rangeEnd = apiEventDate?.split('~').pop()?.trim();

    const candidates: Date[] = [];
    for (const raw of [rangeEnd, content.endDate, content.eventDate]) {
      if (!raw) continue;
      const d = raw instanceof Date ? raw : new Date(String(raw));
      if (!isNaN(d.getTime())) candidates.push(d);
    }
    if (candidates.length === 0) return DEFAULT_TTL;

    // 가장 늦은 종료일 기준 (KST 기준 당일 23:59:59로 간주)
    const end = new Date(Math.max(...candidates.map((d) => d.getTime())));
    end.setUTCHours(14, 59, 59, 999); // KST 23:59:59 ≈ UTC 14:59:59

    const seconds = Math.floor((end.getTime() - Date.now()) / 1000);
    if (seconds <= 0) return MIN_TTL;
    return Math.min(seconds, MAX_TTL);
  }

  /**
   * 지역/장소 검색 → 좌표 반환 (네이버 지역검색 API 프록시)
   */
  @Get('geocode')
  async geocode(@Query('query') query: string) {
    if (!query || !query.trim()) return [];
    const cacheKey = `geocode:${query.trim()}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    let items: any[] = [];

    // 1) 네이버 지역검색 (검색 API 키가 설정된 경우)
    const naverClientId = process.env.NAVER_CLIENT_ID;
    const naverClientSecret = process.env.NAVER_CLIENT_SECRET;
    if (naverClientId && naverClientSecret) {
      try {
        const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query.trim())}&display=5`;
        const res = await fetch(url, {
          headers: { 'X-Naver-Client-Id': naverClientId, 'X-Naver-Client-Secret': naverClientSecret },
        });
        if (res.ok) {
          const data = await res.json();
          items = (data.items || []).map((it: any) => ({
            name: (it.title || '').replace(/<[^>]+>/g, ''),
            address: it.address || '',
            category: it.category || '',
            // mapx/mapy는 경위도*1e7 단위
            lng: it.mapx ? Number(it.mapx) / 10000000 : null,
            lat: it.mapy ? Number(it.mapy) / 10000000 : null,
          })).filter((it: any) => it.lat != null && it.lng != null);
        }
      } catch {
        // 네이버 실패 시 폴백
      }
    }

    // 2) 폴백: OSM Nominatim (키 불필요)
    if (items.length === 0) {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=ko&q=${encodeURIComponent(query.trim())}`;
        const res = await fetch(url, { headers: { 'User-Agent': 'IEUM-App/1.0' } });
        if (res.ok) {
          const data = await res.json();
          items = (data || []).map((it: any) => ({
            name: it.name || it.display_name?.split(',')[0] || query.trim(),
            address: it.display_name || '',
            category: it.type || '',
            lng: it.lon ? Number(it.lon) : null,
            lat: it.lat ? Number(it.lat) : null,
          })).filter((it: any) => it.lat != null && it.lng != null);
        }
      } catch {
        // 무시
      }
    }

    await this.redis.set(cacheKey, JSON.stringify(items), 3600);
    return items;
  }

  /**
   * 가격 문자열이 "완전 무료"인지 판정.
   * - "무료", "무료입장", "0원" → true
   * - "성인 5,000원 / 청소년 무료" 같이 유료 금액이 섞여 있으면 false
   * - "50,000원"의 끝 "0원" 오탐 방지
   */
  private isFreePrice(price?: string | null): boolean {
    if (!price) return false;
    const p = price.replace(/\s/g, '');
    const amounts = [...p.matchAll(/(\d[\d,]*)원/g)].map((m) =>
      parseInt(m[1].replace(/,/g, ''), 10),
    );
    if (amounts.some((n) => n > 0)) return false;
    return p.includes('무료') || amounts.includes(0);
  }

  /**
   * 목록 무료 여부 일괄 조회 — isFree 미상 항목은 detail2를 조회해 판정·저장
   */
  @Get('free-status')
  async freeStatus(@Query('ids') ids?: string) {
    const idList = (ids || '')
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n))
      .slice(0, 50);
    if (idList.length === 0) return [];

    const contents = await this.contentRepository.find({ where: { id: In(idList) } });
    const byId = new Map(contents.map((c) => [c.id, c]));
    const result: { id: number; isFree: boolean | null }[] = [];

    // 이미 판정된 값은 Redis 캐시에서 즉시 반환
    const unknown: Content[] = [];
    await Promise.all(
      idList.map(async (id) => {
        const cached = await this.redis.get(`free-status:${id}`);
        if (cached !== null) {
          result.push({ id, isFree: JSON.parse(cached) });
          return;
        }
        const content = byId.get(id);
        if (!content) {
          result.push({ id, isFree: null });
          return;
        }
        if (content.isFree != null) {
          result.push({ id, isFree: content.isFree });
          await this.redis.set(`free-status:${id}`, JSON.stringify(content.isFree), 86400);
          return;
        }
        unknown.push(content);
      }),
    );

    // 미판정 항목: detail2 조회 (외부 API 초당 제한 대응 — 3개씩 순차 처리)
    for (let i = 0; i < unknown.length; i += 3) {
      await Promise.all(
        unknown.slice(i, i + 3).map(async (content) => {
          let isFree: boolean | null = null;
          if (content.contentsn) {
            try {
              const detail = await this.cultureApi.getContentDetail(content.contentsn);
              if (detail?.reservationInfo != null) {
                isFree = this.isFreePrice(detail.reservationInfo);
                content.isFree = isFree;
                this.contentRepository.update({ id: content.id }, { isFree }).catch(() => {});
              }
            } catch {
              // 외부 API 실패 시 null 유지
            }
          }
          // null(미판정)은 5분만 캐시해 재시도 허용
          await this.redis.set(`free-status:${content.id}`, JSON.stringify(isFree), isFree == null ? 300 : 86400);
          result.push({ id: content.id, isFree });
        }),
      );
    }
    return result;
  }

  /** 게시된 콘텐츠의 분류 목록 (필터용) */
  @Get('categories')
  async categories() {
    const rows = await this.contentRepository
      .createQueryBuilder('content')
      .select('DISTINCT content.categoryCd', 'categoryCd')
      .where('content.isPublished = true')
      .andWhere('content.categoryCd IS NOT NULL')
      .orderBy('content.categoryCd', 'ASC')
      .getRawMany<{ categoryCd: string }>();
    return rows.map((r) => r.categoryCd);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const cacheKey = `contents:item:${id}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const content = await this.contentRepository.findOne({ where: { id } });
    if (content) {
      await this.redis.set(cacheKey, JSON.stringify(content), CACHE_TTL);
    }

    return content;
  }
}
