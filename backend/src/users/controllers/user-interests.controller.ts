import { Controller, Get, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserInterests } from '../entities/user-interests.entity';

@Controller('user-interests')
export class UserInterestsController {
  constructor(
    @InjectRepository(UserInterests)
    private readonly repository: Repository<UserInterests>,
  ) {}

  @Get(':userId')
  async findByUserId(@Param('userId') userId: number) {
    return this.repository.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }
}