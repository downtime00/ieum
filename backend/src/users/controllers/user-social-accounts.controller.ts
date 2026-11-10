import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSocialAccounts } from '../entities/user-social-accounts.entity';
import { CreateSocialAccountDto } from '../dto/create-social-account.dto';

@Injectable()
export class UserSocialAccountsController {
  constructor(
    @InjectRepository(UserSocialAccounts)
    private readonly repository: Repository<UserSocialAccounts>,
  ) {}

  async create(createSocialAccountDto: CreateSocialAccountDto): Promise<UserSocialAccounts> {
    return this.repository.save({ ...createSocialAccountDto, createdAt: new Date(), updatedAt: new Date() });
  }

  async findByUserId(userId: number) {
    return this.repository.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }
}