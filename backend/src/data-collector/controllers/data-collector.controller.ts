import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { DataCollector } from '../services/data-collector.service';

@Controller('data-collector')
export class DataCollectorController {
  constructor(private readonly dataCollector: DataCollector) {}

  @Post('collect/area/:areaCode')
  async collectArea(@Param('areaCode') areaCode: string, @Body('categoryCd') categoryCd?: string, @Query('limit') limit = 50) {
    const count = await this.dataCollector.collectContent({ areaCode, categoryCd });
    return { success: true, count };
  }

  @Post('collect/multiple')
  async collectMultipleAreas(@Body('areas') areas: string[]) {
    const results = await this.dataCollector.collectMultipleAreas(areas);
    return { success: true, results };
  }

  @Get('status')
  async getStatus(): Promise<{ collectedAt: Date; lastCollectionCount: number }> {
    // 상태 조회 로직 추가
    return { collectedAt: new Date(), lastCollectionCount: 0 };
  }
}