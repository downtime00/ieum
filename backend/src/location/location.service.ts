import { Injectable, Logger } from '@nestjs/common';

export interface IpLocation {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  postal?: string;
  timezone?: string;
}

interface IpWhoIsResponse {
  success: boolean;
  ip?: string;
  country?: string;
  country_code?: string;
  region?: string;
  region_code?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  postal?: string;
  timezone?: { id?: string; utc?: string };
  message?: string;
}

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);
  private readonly apiUrl = 'https://ipwho.is';

  /**
   * IP 주소로부터 지역 정보를 조회한다.
   * ipwho.is 무료 API 사용 (HTTPS, 인증키 불필요, 분당 10,000 요청 제한)
   */
  async getLocationByIp(ip: string): Promise<IpLocation | null> {
    if (!ip || this.isPrivateIp(ip)) {
      return null;
    }

    try {
      const fields = [
        'success', 'ip', 'country', 'country_code', 'region',
        'region_code', 'city', 'latitude', 'longitude', 'postal', 'timezone',
      ].join(',');

      const response = await fetch(`${this.apiUrl}/${ip}?fields=${fields}`);
      if (!response.ok) {
        throw new Error(`ipwho.is HTTP 오류: ${response.status}`);
      }

      const data = (await response.json()) as IpWhoIsResponse;
      if (!data.success) {
        this.logger.warn(`ipwho.is 조회 실패: ${data.message || '알 수 없는 오류'}`);
        return null;
      }

      return {
        ip: data.ip || ip,
        country: data.country || '',
        countryCode: data.country_code || '',
        region: data.region || '',
        city: data.city || '',
        latitude: data.latitude ?? 0,
        longitude: data.longitude ?? 0,
        postal: data.postal,
        timezone: data.timezone?.id,
      };
    } catch (error) {
      this.logger.error(
        `IP 지역 조회 실패 (${ip}): ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      );
      return null;
    }
  }

  /**
   * 요청 객체에서 클라이언트 IP를 추출한다.
   * 프록시/로드밸런서 뒤에서는 X-Forwarded-For 헤더를 우선 사용한다.
   */
  extractClientIp(req: any): string {
    const forwarded = req.headers?.['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }
    if (Array.isArray(forwarded) && forwarded.length > 0) {
      return String(forwarded[0]).split(',')[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || '';
  }

  private isPrivateIp(ip: string): boolean {
    return (
      ip === '127.0.0.1' ||
      ip === '::1' ||
      ip === 'localhost' ||
      ip.startsWith('10.') ||
      ip.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
      ip.startsWith('::ffff:127.') ||
      ip.startsWith('::ffff:10.') ||
      ip.startsWith('::ffff:192.168.')
    );
  }
}
