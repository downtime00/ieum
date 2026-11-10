import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserInterests } from '../entities/user-interests.entity';
import { CreateUserInterestDto } from '../dto/create-user-interest.dto';

@Injectable()
export class UserInterestsService {
  constructor(
    @InjectRepository(UserInterests)
    private readonly repository: Repository<UserInterests>,
  ) {}

  async create(createUserInterestDto: CreateUserInterestDto): Promise<UserInterests> {
    const data = { ...createUserInterestDto, createdAt: new Date() };
    return this.repository.save(data);
  }

  async findByUserId(userId: number) {
    return this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}