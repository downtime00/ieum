import { Controller, Get, Req } from '@nestjs/common';
import { LocationService } from './location.service';

@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  /**
   * 요청 IP 기반 지역 정보 조회
   * GET /location/ip
   */
  @Get('ip')
  async getLocationByIp(@Req() req) {
    const ip = this.locationService.extractClientIp(req);
    const location = await this.locationService.getLocationByIp(ip);

    return {
      success: !!location,
      ip,
      location,
      message: location
        ? undefined
        : '로컬/사설 IP에서는 지역 정보를 조회할 수 없습니다.',
    };
  }
}
