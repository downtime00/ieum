import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtService } from './jwt.service';
import { UserRepository } from '../users/user.repository';
import { UserSocialAccountRepository } from '../users/user-social-account.repository';
import { RefreshTokenRepository } from '../users/refresh-token.repository';
import { User } from '../users/entities/user.entity';
import { UserSocialAccount } from '../users/entities/user-social-account.entity';
import { RefreshToken } from '../users/entities/refresh-token.entity';
import { KakaoAuthProvider } from './providers/kakao.provider';
import { NaverAuthProvider } from './providers/naver.provider';
import { GoogleAuthProvider } from './providers/google.provider';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserSocialAccount, RefreshToken]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtService,
    UserRepository,
    UserSocialAccountRepository,
    RefreshTokenRepository,
    KakaoAuthProvider,
    NaverAuthProvider,
    GoogleAuthProvider,
    JwtStrategy,
  ],
  exports: [AuthService, JwtService],
})
export class AuthModule {}
