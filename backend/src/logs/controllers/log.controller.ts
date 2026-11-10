import { Controller, Get, Delete, Query, Param, UsePipes } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LogService } from '../services/log.service';
import { queryLogsSchema, type QueryLogsDto } from '../../common/dto/query-logs.dto';
import { ZodValidationPipe } from '../../common/validation/zod.validation.pipe';
import { LogLevel } from '../../common/entities/log.entity';

@ApiTags('logs')
@Controller('logs')
export class LogController {
  constructor(private readonly logService: LogService) {}

  /**
   * 로그 목록 조회
   */
  @Get()
  @UsePipes(new ZodValidationPipe(queryLogsSchema))
  @ApiOperation({ summary: '로그 목록 조회 (Admin)' })
  @ApiResponse({ status: 200, description: '로그 목록' })
  async getLogs(@Query() query: QueryLogsDto) {
    return this.logService.getLogs(query);
  }

  /**
   * 로그 상세 조회
   */
  @Get(':id')
  @ApiOperation({ summary: '로그 상세 조회 (Admin)' })
  @ApiResponse({ status: 200, description: '로그 상세' })
  @ApiResponse({ status: 404, description: '로그를 찾을 수 없음' })
  async getLogById(@Param('id') id: string) {
    return this.logService.getLogById(parseInt(id));
  }

  /**
   * 로그 레벨별 통계
   */
  @Get('stats/level')
  @ApiOperation({ summary: '로그 레벨별 통계 (Admin)' })
  @ApiResponse({ status: 200, description: '레벨별 통계' })
  async getLogLevelStats() {
    return this.logService.getLogLevelStats();
  }

  /**
   * 컨텍스트별 통계
   */
  @Get('stats/context')
  @ApiOperation({ summary: '컨텍스트별 통계 (Admin)' })
  @ApiResponse({ status: 200, description: '컨텍스트별 통계' })
  async getContextStats(@Query('limit') limit?: string) {
    return this.logService.getContextStats(limit ? parseInt(limit) : 10);
  }

  /**
   * 일별 통계
   */
  @Get('stats/daily')
  @ApiOperation({ summary: '일별 로그 통계 (Admin)' })
  @ApiResponse({ status: 200, description: '일별 통계' })
  async getDailyStats(@Query('days') days?: string) {
    return this.logService.getDailyStats(days ? parseInt(days) : 30);
  }

  /**
   * 오래된 로그 삭제
   */
  @Delete('old')
  @ApiOperation({ summary: '오래된 로그 삭제 (Admin)' })
  @ApiResponse({ status: 200, description: '삭제된 로그 수' })
  async deleteOldLogs(@Query('days') days?: string) {
    return this.logService.deleteOldLogs(days ? parseInt(days) : 90);
  }

  /**
   * 특정 레벨 로그 삭제
   */
  @Delete('level/:level')
  @ApiOperation({ summary: '특정 레벨 로그 삭제 (Admin)' })
  @ApiResponse({ status: 200, description: '삭제된 로그 수' })
  async deleteLogsByLevel(@Param('level') level: LogLevel) {
    return this.logService.deleteLogsByLevel(level);
  }
}
