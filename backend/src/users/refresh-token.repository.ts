import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';

@Injectable()
export class RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly repository: Repository<RefreshToken>,
  ) {}

  create(token: Partial<RefreshToken>): RefreshToken {
    return this.repository.create(token);
  }

  save(token: RefreshToken): Promise<RefreshToken> {
    return this.repository.save(token);
  }

  findOne(token: string): Promise<RefreshToken | null> {
    return this.repository.findOne({ where: { token } });
  }

  findByUserId(userId: number): Promise<RefreshToken[]> {
    return this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async revoke(userId: number, token: string): Promise<void> {
    await this.repository.update(
      { userId, token },
      { revokedAt: new Date() },
    );
  }

  async revokeAll(userId: number): Promise<void> {
    await this.repository.update(
      { userId },
      { revokedAt: new Date() },
    );
  }

  async deleteExpired(): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .delete()
      .where('expires_at < :now', { now: new Date() })
      .execute();
  }
}
