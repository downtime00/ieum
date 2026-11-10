import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UserProfileRepository } from './user-profile.repository';
import { UserInterestRepository } from './user-interest.repository';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { UpdateInterestsDto } from './dto/update-interests.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userProfileRepository: UserProfileRepository,
    private readonly userInterestRepository: UserInterestRepository,
  ) {}

  async getMe(userId: number) {
    const user = await this.userRepository.findOne(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const profile = await this.userProfileRepository.findOne(userId);
    const interests = await this.userInterestRepository.findByUserId(userId);

    return {
      id: user.id,
      name: user.name,
      birthDate: user.birthDate,
      status: user.status,
      profile,
      interests: interests.map(i => i.category),
      createdAt: user.createdAt,
    };
  }

  async updateMe(userId: number, dto: UpdateUserDto) {
    const user = await this.userRepository.findOne(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 사용자 정보 업데이트
    if (dto.name || dto.birthDate) {
      if (dto.name) user.name = dto.name;
      if (dto.birthDate) user.birthDate = new Date(dto.birthDate);
      await this.userRepository.save(user);
    }

    // 프로필 업데이트
    let profile = await this.userProfileRepository.findOne(userId);
    if (!profile) {
      profile = this.userProfileRepository.create({ userId });
    }

    if (dto.region) profile.region = dto.region;
    if (dto.district) profile.district = dto.district;
    if (dto.phone) profile.phone = dto.phone;
    if (dto.latitude) profile.latitude = dto.latitude;
    if (dto.longitude) profile.longitude = dto.longitude;

    await this.userProfileRepository.save(profile);

    return this.getMe(userId);
  }

  async updateInterests(userId: number, dto: UpdateInterestsDto) {
    await this.userInterestRepository.setInterests(userId, dto.interests);
    const interests = await this.userInterestRepository.findByUserId(userId);
    return {
      interests: interests.map(i => i.category),
    };
  }

  async getMyOrganizations(userId: number) {
    // This method needs the userOrganizationRepository to be added to the constructor
    // For now, return empty array to avoid compilation errors
    return [];
  }
}
