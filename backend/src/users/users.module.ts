import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserSocialAccount } from './entities/user-social-account.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { UserProfile } from './entities/user-profile.entity';
import { UserInterest } from './entities/user-interest.entity';
import { UserOrganization } from '../organizations/entities/user-organization.entity';
import { UserRepository } from './user.repository';
import { UserSocialAccountRepository } from './user-social-account.repository';
import { RefreshTokenRepository } from './refresh-token.repository';
import { UserProfileRepository } from './user-profile.repository';
import { UserInterestRepository } from './user-interest.repository';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserSocialAccount, RefreshToken, UserProfile, UserInterest, UserOrganization]),
  ],
  providers: [
    UserRepository,
    UserSocialAccountRepository,
    RefreshTokenRepository,
    UserProfileRepository,
    UserInterestRepository,
    UsersService,
  ],
  controllers: [UsersController],
  exports: [
    UserRepository,
    UserSocialAccountRepository,
    RefreshTokenRepository,
    UserProfileRepository,
    UserInterestRepository,
    UsersService,
  ],
})
export class UsersModule {}
