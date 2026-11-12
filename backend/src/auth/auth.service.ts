import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from './jwt.service';
import { UserRepository } from '../users/user.repository';
import { UserSocialAccountRepository } from '../users/user-social-account.repository';
import { RefreshTokenRepository } from '../users/refresh-token.repository';
import { SocialAuthProvider } from './interfaces/social-auth-provider.interface';
import { KakaoAuthProvider } from './providers/kakao.provider';
import { NaverAuthProvider } from './providers/naver.provider';
import { GoogleAuthProvider } from './providers/google.provider';
import { SNSUserInfo } from './interfaces/social-auth-provider.interface';
import { randomBytes } from 'crypto';
import { UserStatus } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    name: string;
    role?: string;
    createdAt: Date;
  };
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly providers: Map<string, SocialAuthProvider>;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly socialAccountRepository: UserSocialAccountRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
  ) {
    this.providers = new Map<string, SocialAuthProvider>([
      ['KAKAO', new KakaoAuthProvider()],
      ['NAVER', new NaverAuthProvider()],
      ['GOOGLE', new GoogleAuthProvider()],
    ]);
  }

  async getAuthUrl(provider: string): Promise<{ authUrl: string }> {
    const authProvider = this.providers.get(provider.toUpperCase());
    if (!authProvider) {
      throw new BadRequestException('Unsupported provider');
    }

    const state = this.generateState();
    await this.saveState(state);

    return { authUrl: await authProvider.getAuthUrl(state) };
  }

  async handleCallback(
    provider: string,
    code: string,
    state: string,
  ): Promise<AuthResponse> {
    // State 검증
    if (!(await this.validateState(state))) {
      throw new BadRequestException('Invalid state');
    }

    const authProvider = this.providers.get(provider.toUpperCase());
    if (!authProvider) {
      throw new BadRequestException('Unsupported provider');
    }

    // Access Token 획득
    const accessToken = await authProvider.getAccessToken(code);

    // 사용자 정보 조회
    const snsUserInfo = await authProvider.getUserInfo(accessToken);

    // 기존 사용자 확인
    let user = await this.findUserBySNS(
      provider.toUpperCase(),
      snsUserInfo.providerUserId,
    );

    // 없으면 사용자 생성
    if (!user) {
      user = await this.createUser(snsUserInfo);
    }

    // SNS 계정 연결
    await this.linkSocialAccount(user.id, snsUserInfo);

    // 우리 서비스 토큰 생성
    const { accessToken: ourAccessToken, refreshToken } =
      await this.generateTokens(user.id);

    return {
      accessToken: ourAccessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }

  async refreshTokens(refreshToken: string): Promise<TokenResponse> {
    // Refresh Token 검증
    const payload = this.jwtService.verifyRefreshToken(refreshToken);

    // Refresh Token 유효성 확인
    const isValid = await this.validateRefreshToken(
      payload.sub,
      refreshToken,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 새로운 토큰 생성
    const { accessToken, refreshToken: newRefreshToken } =
      await this.generateTokens(payload.sub);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: number, refreshToken: string): Promise<void> {
    // Refresh Token 폐기
    await this.refreshTokenRepository.revoke(userId, refreshToken);
  }

  /**
   * 이메일/비밀번호 로그인
   */
  async emailLogin(email: string, password: string): Promise<AuthResponse> {
    // 이메일로 사용자 찾기
    const user = await this.userRepository.findByEmail(email);
    
    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    // 사용자 상태 확인
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('비활성화된 계정입니다.');
    }

    // 비밀번호 검증
    if (!user.password) {
      throw new UnauthorizedException('이 계정은 SNS 로그인만 지원합니다.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    // 토큰 생성
    const { accessToken, refreshToken } = await this.generateTokens(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name || email,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }

  /**
   * 이메일 회원가입
   */
  async emailRegister(email: string, password: string, name?: string): Promise<AuthResponse> {
    // 이메일 중복 확인
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('이미 존재하는 이메일입니다.');
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      name: name || email.split('@')[0],
      status: UserStatus.ACTIVE,
    });
    const savedUser = await this.userRepository.save(user);

    // 토큰 생성
    const { accessToken, refreshToken } = await this.generateTokens(savedUser.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: savedUser.id,
        name: savedUser.name,
        role: savedUser.role,
        createdAt: savedUser.createdAt,
      },
    };
  }

  private async findUserBySNS(
    provider: string,
    providerUserId: string,
  ): Promise<any> {
    const socialAccount = await this.socialAccountRepository.findOne(
      provider,
      providerUserId,
    );
    return socialAccount?.user || null;
  }

  private async createUser(
    snsUserInfo: SNSUserInfo,
  ): Promise<any> {
    const user = this.userRepository.create({
      name: snsUserInfo.name,
      status: UserStatus.ACTIVE,
    });
    return this.userRepository.save(user);
  }

  private async linkSocialAccount(
    userId: number,
    snsUserInfo: SNSUserInfo,
  ): Promise<void> {
    const existing = await this.socialAccountRepository.findOne(
      snsUserInfo.provider,
      snsUserInfo.providerUserId,
    );

    if (!existing) {
      const socialAccount = this.socialAccountRepository.create({
        userId,
        provider: snsUserInfo.provider,
        providerUserId: snsUserInfo.providerUserId,
        email: snsUserInfo.email,
        profileName: snsUserInfo.name,
        profileImage: snsUserInfo.profileImage,
      });
      await this.socialAccountRepository.save(socialAccount);
    }
  }

  private async generateTokens(userId: number): Promise<TokenResponse> {
    const accessToken = this.jwtService.generateAccessToken(userId);
    const refreshToken = this.jwtService.generateRefreshToken(userId);

    // Refresh Token 저장
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const token = this.refreshTokenRepository.create({
      userId,
      token: refreshToken,
      expiresAt,
    });
    await this.refreshTokenRepository.save(token);

    return { accessToken, refreshToken };
  }

  private generateState(): string {
    return randomBytes(32).toString('hex');
  }

  private async saveState(state: string): Promise<void> {
    // 실제 구현에서는 Redis에 저장
    // await this.redisService.setex(`oauth:state:${state}`, 600, state);
  }

  private async validateState(state: string): Promise<boolean> {
    // 실제 구현에서는 Redis에서 확인
    // const saved = await this.redisService.get(`oauth:state:${state}`);
    // if (saved) {
    //   await this.redisService.del(`oauth:state:${state}`);
    //   return true;
    // }
    return true;
  }

  private async validateRefreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<boolean> {
    const token = await this.refreshTokenRepository.findOne(refreshToken);
    return !!token && Number(token.userId) === userId && !token.revokedAt;
  }
}
