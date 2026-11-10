import { Controller, Get, Post, Body, Query, Param, Res, Req, UseGuards, UsePipes } from '@nestjs/common';
import { Response } from 'express';
import { AuthService, AuthResponse } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { loginRequestSchema, type LoginRequestDto } from './dto/login.dto';
import { refreshTokenRequestSchema, type RefreshTokenDto } from './dto/zod-refresh-token.dto';
import { emailLoginSchema, type EmailLoginDto } from './dto/email-login.dto';
import { ZodValidationPipe } from '../common/validation/zod.validation.pipe';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get(':provider')
  async getAuthUrl(
    @Param('provider') provider: string,
  ) {
    return this.authService.getAuthUrl(provider);
  }

  @Get(':provider/callback')
  async handleCallback(
    @Param('provider') provider: string,
    @Body() body: LoginRequestDto,
    @Res() res: Response,
  ) {
    const result = await this.authService.handleCallback(provider, body.code, body.state);

    // Refresh Token을 HttpOnly Cookie로 설정
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
      path: '/',
    });

    // Frontend로 리다이렉트
    res.redirect(`${process.env.ALLOWED_ORIGINS?.split(',')[0] || 'http://localhost:3000'}?token=${result.accessToken}`);
  }

  @Post('token/refresh')
  async refreshTokens(@Body() body: RefreshTokenDto): Promise<void> {
    await this.authService.refreshTokens(body.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @Req() req,
    @Body() body: RefreshTokenDto,
    @Res() res: Response,
  ) {
    await this.authService.logout(req.user.id, body.refreshToken);

    // 쿠키 삭제
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    res.json({ success: true, message: '로그아웃 되었습니다.' });
  }

  /**
   * 이메일 로그인
   */
  @Post('email/login')
  @UsePipes(new ZodValidationPipe(emailLoginSchema))
  async emailLogin(@Body() body: EmailLoginDto): Promise<AuthResponse> {
    return this.authService.emailLogin(body.email, body.password);
  }

  /**
   * 이메일 회원가입
   */
  @Post('email/register')
  @UsePipes(new ZodValidationPipe(emailLoginSchema))
  async emailRegister(
    @Body() body: EmailLoginDto & { name?: string },
  ): Promise<AuthResponse> {
    return this.authService.emailRegister(body.email, body.password, body.name);
  }
}
