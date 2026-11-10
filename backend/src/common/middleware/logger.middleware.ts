import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LogService } from '../../logs/services/log.service';
import { LogLevel } from '../entities/log.entity';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  constructor(private readonly logService: LogService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, url, ip, headers } = req;

    // 응답 시간 측정
    res.on('finish', async () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;

      // 로그 레벨 결정
      let level: LogLevel = LogLevel.INFO;
      if (statusCode >= 500) {
        level = LogLevel.ERROR;
      } else if (statusCode >= 400) {
        level = LogLevel.WARN;
      }

      // 데이터베이스에 로그 저장 (비동기)
      try {
        await this.logService.createLog({
          level,
          message: `${method} ${url} - ${statusCode}`,
          context: 'HTTP',
          meta: {
            method,
            url,
            statusCode,
            duration,
          },
          userId: (req as any).user?.id?.toString(),
          ip,
          userAgent: headers['user-agent'],
        });
      } catch (error) {
        // 로그 저장 실패는 애플리케이션 동작에 영향을 주지 않음
        this.logger.error('로그 저장 실패:', error);
      }

      // 콘솔 로그
      const message = `${method} ${url} ${statusCode} - ${duration}ms`;
      if (statusCode >= 500) {
        this.logger.error(message);
      } else if (statusCode >= 400) {
        this.logger.warn(message);
      } else {
        this.logger.log(message);
      }
    });

    next();
  }
}
