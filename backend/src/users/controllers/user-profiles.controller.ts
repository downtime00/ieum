import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfiles } from '../entities/user-profiles.entity';
import { CreateUserProfileDto } from '../dto/create-user-profile.dto';

@Controller('user-profiles')
export class UserProfilesController {
  constructor(
    @InjectRepository(UserProfiles)
    private readonly repository: Repository<UserProfiles>,
  ) {}

  @Get(':userId')
  async findByUserId(@Param('userId') userId: number) {
    const profile = await this.repository.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('프로파일을 찾을 수 없습니다');
    }
    return profile;
  }
}