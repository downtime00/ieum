import { Injectable, Logger } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';

export interface DataSourceAdapter {
  name: string;
  getContentList(page: number, limit: number, filters: any): Promise<any[]>;
}

/**
 * 한국문화정보원_한눈에보는문화정보조회서비스 (/period2) 요청 파라미터
 * - PageNo: 페이지번호
 * - numOfrows: 한 페이지 결과 수
 * - keyword: 검색키워드
 * - gpsxfrom/gpsyfrom/gpsxto/gpsyto: GPS 범위 (경도/위도 하한·상한)
 * - serviceTp: 서비스구분 (A:공연/전시, B:행사/축제, C:교육/체험)
 * - from/to: 시작/종료 기간 (YYYYMMDD)
 */
export interface CultureInfoFilters {
  areaCode?: string;
  categoryCd?: string;
  keyword?: string;
  serviceTp?: 'A' | 'B' | 'C';
  startDate?: string; // YYYYMMDD -> from
  endDate?: string;   // YYYYMMDD -> to
  gpsxfrom?: number;
  gpsyfrom?: number;
  gpsxto?: number;
  gpsyto?: number;
  // /area2, /realm2 지역/분야별 조회 전용
  sido?: string;      // 시/도 (예: 서울, 부산)
  sigungu?: string;   // 시군구 (예: 관악구, 해운대구)
  place?: string;     // 장소명
  sortStdr?: 1 | 2 | 3; // 정렬기준 (1:등록일, 2:공연명, 3:지역)
  realmCode?: string; // 분야 분류코드 (A000:연극, B000:음악/콘서트, B002:국악, C000:무용/발레, D000:전시, B003:뮤지컬/오페라, E000:아동/가족, F000:행사/축제, G000:교육/체험, H000:도서, I000:체육, L000:기타)
}

interface CultureApiItem {
  serviceName?: string;
  seq?: string | number;
  title?: string;
  startDate?: string;
  endDate?: string;
  place?: string;
  realmName?: string;
  area?: string;
  sigungu?: string;
  thumbnail?: string;
  gpsX?: string | number;
  gpsY?: string | number;
  url?: string;
  imgUrl?: string;
  price?: string;
  phone?: string;
  placeUrl?: string;
  placeAddr?: string;
}

interface LivelihoodItem {
  seq?: string | number;
  title?: string;
  orgName?: string;
  regDate?: string;
  url?: string;
}

@Injectable()
export class CultureApiAdapter implements DataSourceAdapter {
  readonly name = 'culture-api';
  private readonly logger = new Logger(CultureApiAdapter.name);
  private readonly parser = new XMLParser({
    ignoreAttributes: true,
    parseTagValue: false,
    trimValues: true,
  });

  private get baseUrl(): string {
    return (
      process.env.CULTURE_API_BASE_URL ||
      'https://apis.data.go.kr/B553457/cultureinfo'
    );
  }

  private get serviceKey(): string {
    const key = process.env.CULTURE_API_KEY;
    if (!key) {
      throw new Error('CULTURE_API_KEY 환경 변수가 설정되지 않았습니다.');
    }
    return key;
  }

  /**
   * 기간별 문화정보 목록 조회 (/period2)
   */
  async getContentList(
    page: number,
    limit: number,
    filters: CultureInfoFilters = {},
  ): Promise<any[]> {
    const params = new URLSearchParams({
      serviceKey: this.serviceKey,
      PageNo: String(page),
      numOfrows: String(limit),
    });

    if (filters.keyword) params.set('keyword', filters.keyword);
    if (filters.serviceTp) params.set('serviceTp', filters.serviceTp);
    if (filters.startDate) params.set('from', filters.startDate);
    if (filters.endDate) params.set('to', filters.endDate);
    if (filters.gpsxfrom != null) params.set('gpsxfrom', String(filters.gpsxfrom));
    if (filters.gpsyfrom != null) params.set('gpsyfrom', String(filters.gpsyfrom));
    if (filters.gpsxto != null) params.set('gpsxto', String(filters.gpsxto));
    if (filters.gpsyto != null) params.set('gpsyto', String(filters.gpsyto));

    const url = `${this.baseUrl}/period2?${params.toString()}`;

    try {
      const xml = await this.fetchXml(url);
      const items = this.parseListResponse(xml);

      // period2는 지역/분야 파라미터가 없으므로 클라이언트 측에서 필터링
      return items.filter((item) => {
        if (filters.areaCode && !this.matchArea(item, filters.areaCode)) return false;
        if (filters.categoryCd && item.categoryCd !== filters.categoryCd) return false;
        return true;
      });
    } catch (error) {
      this.logger.error(
        `문화정보 목록 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      );
      throw error;
    }
  }

  /**
   * 지역별 문화정보 목록 조회 (/area2)
   * sido, sigungu, place, sortStdr 파라미터 지원
   */
  async getContentListByArea(
    page: number,
    limit: number,
    filters: CultureInfoFilters = {},
  ): Promise<any[]> {
    const { sido, sigungu } = this.resolveArea(filters);
    return this.fetchCultureList('area2', page, limit, filters, {
      ...(sido ? { sido } : {}),
      ...(sigungu ? { sigungu } : {}),
    });
  }

  /**
   * 분야별 문화정보 목록 조회 (/realm2)
   * realmCode 파라미터 지원 (A000:연극, D000:전시 등)
   */
  async getContentListByRealm(
    page: number,
    limit: number,
    filters: CultureInfoFilters = {},
  ): Promise<any[]> {
    return this.fetchCultureList('realm2', page, limit, filters, {
      ...(filters.realmCode ? { realmCode: filters.realmCode } : {}),
    });
  }

  /**
   * /area2, /realm2 공통 조회 로직
   */
  private async fetchCultureList(
    endpoint: 'area2' | 'realm2',
    page: number,
    limit: number,
    filters: CultureInfoFilters,
    extraParams: Record<string, string> = {},
  ): Promise<any[]> {
    const params = new URLSearchParams({
      serviceKey: this.serviceKey,
      PageNo: String(page),
      numOfrows: String(limit),
      ...extraParams,
    });

    if (filters.place) params.set('place', filters.place);
    if (filters.keyword) params.set('keyword', filters.keyword);
    if (filters.serviceTp) params.set('serviceTp', filters.serviceTp);
    if (filters.startDate) params.set('from', filters.startDate);
    if (filters.endDate) params.set('to', filters.endDate);
    if (filters.sortStdr) params.set('sortStdr', String(filters.sortStdr));
    if (filters.gpsxfrom != null) params.set('gpsxfrom', String(filters.gpsxfrom));
    if (filters.gpsyfrom != null) params.set('gpsyfrom', String(filters.gpsyfrom));
    if (filters.gpsxto != null) params.set('gpsxto', String(filters.gpsxto));
    if (filters.gpsyto != null) params.set('gpsyto', String(filters.gpsyto));

    const url = `${this.baseUrl}/${endpoint}?${params.toString()}`;

    try {
      const xml = await this.fetchXml(url);
      const items = this.parseListResponse(xml);

      return items.filter((item) => {
        if (filters.categoryCd && item.categoryCd !== filters.categoryCd) return false;
        return true;
      });
    } catch (error) {
      this.logger.error(
        `${endpoint} 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      );
      throw error;
    }
  }

  /**
   * 문화캘린더정보 목록 조회 (/livelihood2)
   * 문화행사/교육 등 캘린더성 정보를 일별로 제공
   */
  async getCalendarList(
    page: number,
    limit: number,
    keyword?: string,
  ): Promise<any[]> {
    const params = new URLSearchParams({
      serviceKey: this.serviceKey,
      PageNo: String(page),
      numOfrows: String(limit),
    });
    if (keyword) params.set('keyword', keyword);

    const url = `${this.baseUrl}/livelihood2?${params.toString()}`;

    try {
      const xml = await this.fetchXml(url);
      return this.parseCalendarResponse(xml);
    } catch (error) {
      this.logger.error(
        `문화캘린더 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      );
      throw error;
    }
  }

  /**
   * 문화정보 상세 조회 (/detail2)
   */
  async getContentDetail(seq: string | number): Promise<any | null> {
    const params = new URLSearchParams({
      serviceKey: this.serviceKey,
      seq: String(seq),
    });

    const url = `${this.baseUrl}/detail2?${params.toString()}`;

    try {
      const xml = await this.fetchXml(url);
      const parsed = this.parser.parse(xml);
      const item = parsed?.response?.body?.items?.item;
      if (!item) return null;
      return this.mapItem(item as CultureApiItem);
    } catch (error) {
      this.logger.error(
        `문화정보 상세 조회 실패 (seq=${seq}): ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      );
      return null;
    }
  }

  private async fetchXml(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`문화정보 API HTTP 오류: ${response.status}`);
    }
    return response.text();
  }

  private parseListResponse(xml: string): any[] {
    const parsed = this.parser.parse(xml);
    this.assertSuccess(parsed);

    const items = parsed?.response?.body?.items?.item;
    if (!items) return [];

    const list = Array.isArray(items) ? items : [items];
    return list.map((item) => this.mapItem(item as CultureApiItem));
  }

  private parseCalendarResponse(xml: string): any[] {
    const parsed = this.parser.parse(xml);
    this.assertSuccess(parsed);

    const items = parsed?.response?.body?.items?.item;
    if (!items) return [];

    const list = Array.isArray(items) ? items : [items];
    return list.map((item: LivelihoodItem) => ({
      contentsn: item.seq != null ? String(item.seq) : undefined,
      title: this.decodeEntities(item.title || ''),
      orgName: item.orgName,
      regDate: item.regDate,
      contentLink: item.url ? this.decodeEntities(item.url) : '',
      thumbnail: undefined,
    }));
  }

  private assertSuccess(parsed: any): void {
    const resultCode = parsed?.response?.header?.resultCode;
    if (resultCode && resultCode !== '00') {
      const resultMsg = parsed?.response?.header?.resultMsg || '알 수 없는 오류';
      throw new Error(`문화정보 API 오류 (${resultCode}): ${resultMsg}`);
    }
  }

  /**
   * areaCode("서울 종로구") 또는 sido/sigungu 필터를 { sido, sigungu }로 변환
   */
  private resolveArea(filters: CultureInfoFilters): { sido?: string; sigungu?: string } {
    if (filters.sido || filters.sigungu) {
      return { sido: filters.sido, sigungu: filters.sigungu };
    }
    if (!filters.areaCode) return {};

    const parts = filters.areaCode.trim().split(/\s+/);
    // "서울특별시 종로구" 형태도 처리: 첫 토큰이 시/도, 나머지가 시군구
    const sido = parts[0]?.replace(/(특별시|광역시|특별자치시|특별자치도|도)$/, '');
    const sigungu = parts.length > 1 ? parts.slice(1).join(' ') : undefined;
    return { sido, sigungu };
  }

  private matchArea(item: any, areaCode: string): boolean {
    const target = areaCode.replace(/\s+/g, '');
    const candidates = [item.areaCode, item.locationName].filter(Boolean) as string[];
    return candidates.some((c) => c.replace(/\s+/g, '').includes(target));
  }

  private mapItem(item: CultureApiItem): any {
    const areaParts = [item.area, item.sigungu].filter(Boolean).join(' ');
    const gpsX = item.gpsX != null ? Number(item.gpsX) : undefined;
    const gpsY = item.gpsY != null ? Number(item.gpsY) : undefined;

    return {
      contentsn: item.seq != null ? String(item.seq) : undefined,
      title: this.decodeEntities(item.title || ''),
      summary: item.thumbnail ? `[thumbnail] ${item.thumbnail}` : undefined,
      serviceName: item.serviceName,
      areaCode: areaParts || item.area,
      categoryCd: item.realmName,
      contentLink: item.url ? this.decodeEntities(item.url) : '',
      eventDate: this.formatEventDate(item.startDate, item.endDate),
      locationName: item.place,
      // 한국문화정보원 API: gpsX=경도(longitude), gpsY=위도(latitude)
      latitude: gpsY,
      longitude: gpsX,
      applicationRequired: false,
      reservationInfo: item.price,
      viewcount: 0,
      regdate: item.startDate,
      thumbnail: item.thumbnail || item.imgUrl,
      phone: item.phone,
      placeUrl: item.placeUrl,
      placeAddr: item.placeAddr,
    };
  }

  private formatEventDate(startDate?: string, endDate?: string): string | undefined {
    if (!startDate) return undefined;
    const format = (d?: string) =>
      d && d.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : d;
    const start = format(startDate);
    const end = format(endDate);
    return end && end !== start ? `${start} ~ ${end}` : start;
  }

  private decodeEntities(text: string): string {
    return text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&');
  }
}
