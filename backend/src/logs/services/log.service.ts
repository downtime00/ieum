import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Log, LogLevel } from '../../common/entities/log.entity';
import type { QueryLogsDto } from '../../common/dto/query-logs.dto';
import { AppLogger } from '../../common/logger/logger.service';

@Injectable()
export class LogService {
  private readonly logger = new AppLogger('LogService');

  constructor(
    @InjectRepository(Log)
    private readonly logRepository: Repository<Log>,
  ) {}

  /**
   * 로그 생성
   */
  async createLog(data: Partial<Log>): Promise<Log> {
    this.logger.debug('로그 생성', { data });
    const log = this.logRepository.create(data);
    return this.logRepository.save(log);
  }

  /**
   * 로그 목록 조회 (페이징 및 필터링)
   */
  async getLogs(query: QueryLogsDto) {
    this.logger.log('로그 목록 조회', { query });

    const queryBuilder = this.logRepository.createQueryBuilder('log');

    // 필터링 조건
    if (query.level) {
      queryBuilder.andWhere('log.level = :level', { level: query.level });
    }

    if (query.context) {
      queryBuilder.andWhere('log.context ILIKE :context', { context: `%${query.context}%` });
    }

    if (query.userId) {
      queryBuilder.andWhere('log.userId = :userId', { userId: query.userId });
    }

    if (query.startDate) {
      queryBuilder.andWhere('log.createdAt >= :startDate', {
        startDate: new Date(query.startDate),
      });
    }

    if (query.endDate) {
      queryBuilder.andWhere('log.createdAt <= :endDate', {
        endDate: new Date(query.endDate),
      });
    }

    const [items, total] = await queryBuilder
      .orderBy('log.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  /**
   * 로그 상세 조회
   */
  async getLogById(id: number): Promise<Log> {
    this.logger.log(`로그 상세 조회: ${id}`);
    const log = await this.logRepository.findOne({ where: { id } });

    if (!log) {
      this.logger.warn(`로그를 찾을 수 없음: ${id}`);
      throw new NotFoundException('로그를 찾을 수 없습니다.');
    }

    return log;
  }

  /**
   * 로그 레벨별 통계
   */
  async getLogLevelStats() {
    this.logger.log('로그 레벨별 통계 조회');

    const stats = await this.logRepository
      .createQueryBuilder('log')
      .select('log.level', 'level')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.level')
      .getRawMany();

    return stats.reduce((acc, item) => {
      acc[item.level] = parseInt(item.count);
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * 컨텍스트별 로그 통계
   */
  async getContextStats(limit: number = 10) {
    this.logger.log('컨텍스트별 로그 통계 조회');

    const stats = await this.logRepository
      .createQueryBuilder('log')
      .select('log.context', 'context')
      .addSelect('COUNT(*)', 'count')
      .where('log.context IS NOT NULL')
      .groupBy('log.context')
      .orderBy('count', 'DESC')
      .take(limit)
      .getRawMany();

    return stats;
  }

  /**
   * 일별 로그 통계 (최근 30일)
   */
  async getDailyStats(days: number = 30) {
    this.logger.log('일별 로그 통계 조회');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.logRepository
      .createQueryBuilder('log')
      .select('DATE(log.createdAt)', 'date')
      .addSelect('log.level', 'level')
      .addSelect('COUNT(*)', 'count')
      .where('log.createdAt >= :startDate', { startDate })
      .groupBy('DATE(log.createdAt)')
      .addGroupBy('log.level')
      .orderBy('date', 'DESC')
      .getRawMany();

    // 날짜별로 그룹화
    const grouped = stats.reduce((acc, item) => {
      const date = item.date;
      if (!acc[date]) {
        acc[date] = {};
      }
      acc[date][item.level] = parseInt(item.count);
      return acc;
    }, {} as Record<string, Record<string, number>>);

    return grouped;
  }

  /**
   * 오래된 로그 삭제 (보관 기간 기반)
   */
  async deleteOldLogs(daysToKeep: number = 90): Promise<number> {
    this.logger.log(`${daysToKeep}일 이전 로그 삭제`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.logRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    this.logger.log(`${result.affected}개의 로그 삭제됨`);
    return result.affected || 0;
  }

  /**
   * 특정 레벨 로그 삭제
   */
  async deleteLogsByLevel(level: LogLevel): Promise<number> {
    this.logger.log(`${level} 레벨 로그 삭제`);

    const result = await this.logRepository
      .createQueryBuilder()
      .delete()
      .where('level = :level', { level })
      .execute();

    this.logger.log(`${result.affected}개의 로그 삭제됨`);
    return result.affected || 0;
  }
}
