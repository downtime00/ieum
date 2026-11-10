import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile } from './entities/user-profile.entity';

@Injectable()
export class UserProfileRepository {
  constructor(
    @InjectRepository(UserProfile)
    private readonly repository: Repository<UserProfile>,
  ) {}

  create(profile: Partial<UserProfile>): UserProfile {
    return this.repository.create(profile);
  }

  save(profile: UserProfile): Promise<UserProfile> {
    return this.repository.save(profile);
  }

  findOne(userId: number): Promise<UserProfile | null> {
    return this.repository.findOne({ where: { userId } });
  }

  async update(userId: number, data: Partial<UserProfile>): Promise<void> {
    await this.repository.update(userId, data);
  }
}
