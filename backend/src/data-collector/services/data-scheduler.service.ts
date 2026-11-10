import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataCollector } from './data-collector.service';

@Injectable()
export class DataScheduler implements OnModuleInit {
  private readonly logger = new Logger(DataScheduler.name);
  private isCollecting = false;

  // 전국 시/도 목록 (area2 의 sido 파라미터)
  private readonly areas = [
    '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
    '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
  ];

  constructor(private readonly dataCollector: DataCollector) {}

  async onModuleInit() {
    this.logger.log('[DataScheduler] Scheduler 가 초기화되었습니다');

    // 서버 시작 30초 후 최초 1회 수집
    setTimeout(() => this.collectData(), 30000);
  }

  // 매일 새벽 3시에 전체 지역 수집
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async scheduledCollection() {
    await this.collectData();
  }

  async collectData(): Promise<void> {
    if (this.isCollecting) {
      this.logger.warn('[DataScheduler] 이미 수집 진행 중입니다');
      return;
    }

    this.isCollecting = true;
    this.logger.log('[DataScheduler] 정기 데이터 수집 시작');

    try {
      // 1) 전국 최신 목록 1회
      const nationwide = await this.dataCollector.collectContent({});
      this.logger.log(`[DataScheduler] 전국 수집: ${nationwide} 개`);

      // 2) 시/도별 지역 수집
      const results = await this.dataCollector.collectMultipleAreas(this.areas);
      const totalCount = results.reduce((sum, r) => sum + r.count, 0);
      this.logger.log(`[DataScheduler] 지역 수집 완료: 총 ${totalCount} 개 (${results.length} 개 지역)`);
    } catch (error) {
      this.logger.error('[DataScheduler] 데이터 수집 실패:', error);
    } finally {
      this.isCollecting = false;
    }
  }
}
