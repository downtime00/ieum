import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RedisService } from '../redis/redis.service';

interface CheckResult {
  status: 'ok' | 'down';
  latencyMs?: number;
  message?: string;
}

@Controller('health')
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('detailed')
  async detailed() {
    const started = Date.now();

    const dbCheck = await this.checkDb();
    const redisCheck = await this.checkRedis();

    const mem = process.memoryUsage();
    const overall =
      dbCheck.status === 'ok' && redisCheck.status === 'ok' ? 'ok' : 'degraded';

    return {
      status: overall,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      checks: {
        api: { status: 'ok', latencyMs: Date.now() - started },
        database: dbCheck,
        redis: redisCheck,
      },
      memory: {
        rssMb: Math.round(mem.rss / 1024 / 1024),
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      },
    };
  }

  private async checkDb(): Promise<CheckResult> {
    const started = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', latencyMs: Date.now() - started };
    } catch (err) {
      return {
        status: 'down',
        latencyMs: Date.now() - started,
        message: err instanceof Error ? err.message : 'unknown',
      };
    }
  }

  private async checkRedis(): Promise<CheckResult> {
    const started = Date.now();
    try {
      const ok = await this.redisService.ping();
      return ok
        ? { status: 'ok', latencyMs: Date.now() - started }
        : { status: 'down', latencyMs: Date.now() - started, message: 'PING failed' };
    } catch (err) {
      return {
        status: 'down',
        latencyMs: Date.now() - started,
        message: err instanceof Error ? err.message : 'unknown',
      };
    }
  }
}
