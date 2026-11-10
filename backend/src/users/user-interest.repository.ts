import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserInterest } from './entities/user-interest.entity';

@Injectable()
export class UserInterestRepository {
  constructor(
    @InjectRepository(UserInterest)
    private readonly repository: Repository<UserInterest>,
  ) {}

  create(interest: Partial<UserInterest>): UserInterest {
    return this.repository.create(interest);
  }

  save(interest: UserInterest): Promise<UserInterest> {
    return this.repository.save(interest);
  }

  findByUserId(userId: number): Promise<UserInterest[]> {
    return this.repository.find({ where: { user_id: userId } });
  }

  async setInterests(userId: number, categories: string[]): Promise<void> {
    // 기존 관심분야 삭제
    await this.repository.delete({ user_id: userId });

    // 새로운 관심분야 추가
    for (const category of categories) {
      const interest = this.create({ user_id: userId, category });
      await this.save(interest);
    }
  }

  async delete(userId: number, category: string): Promise<void> {
    await this.repository.delete({ user_id: userId, category });
  }
}
