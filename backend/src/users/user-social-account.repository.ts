import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSocialAccount } from './entities/user-social-account.entity';

@Injectable()
export class UserSocialAccountRepository {
  constructor(
    @InjectRepository(UserSocialAccount)
    private readonly repository: Repository<UserSocialAccount>,
  ) {}

  create(account: Partial<UserSocialAccount>): UserSocialAccount {
    return this.repository.create(account);
  }

  save(account: UserSocialAccount): Promise<UserSocialAccount> {
    return this.repository.save(account);
  }

  findOne(provider: string, providerUserId: string): Promise<UserSocialAccount | null> {
    return this.repository.findOne({
      where: { provider, providerUserId },
      relations: ['user'],
    });
  }

  findByUserId(userId: number): Promise<UserSocialAccount[]> {
    return this.repository.find({
      where: { userId },
      relations: ['user'],
    });
  }
}
