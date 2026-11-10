# Authentication

## 개요
SNS OAuth 기반의 인증 시스템으로, 별도의 회원가입 화면 없이 SNS 최초 로그인 시 사용자를 자동 생성합니다.

## 지원하는 SNS Provider

MVP에서 지원하는 Provider:
- 카카오
- 네이버
- Google

향후 추가 가능:
- Apple (MVP 제외)
- 기타 SNS

## 인증 흐름

```
사용자
    ↓
로그인 화면 (카카오/네이버/Google 선택)
    ↓
SNS OAuth 시작
    ↓
SNS 로그인 페이지
    ↓
사용자 승인
    ↓
Backend Callback (code + state)
    ↓
SNS Access Token 획득
    ↓
SNS 사용자 정보 조회
    ↓
기존 사용자 확인
    ├─ 존재 → 로그인
    └─ 없음 → 사용자 생성
    ↓
우리 서비스 Access Token 생성
    ↓
우리 서비스 Refresh Token 생성
    ↓
클라이언트에 토큰 반환
    ↓
자동 로그인 완료
```

## 구조

### 1. SocialAuthProvider

모든 SNS Provider가 구현해야 하는 인터페이스:

```typescript
interface SocialAuthProvider {
  getAuthUrl(state: string): Promise<string>;
  getAccessToken(code: string): Promise<string>;
  getUserInfo(accessToken: string): Promise<SNSUserInfo>;
  validateIdToken(idToken?: string): Promise<boolean>;
}

interface SNSUserInfo {
  provider: string;
  providerUserId: string;
  email?: string;
  name?: string;
  profileImage?: string;
}
```

### 2. Provider별 구현

#### KakaoAuthProvider

```typescript
class KakaoAuthProvider implements SocialAuthProvider {
  private readonly clientId: string;
  private readonly redirectUri: string;
  private readonly clientSecret: string;

  async getAuthUrl(state: string): Promise<string> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      state: state,
    });
    return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
  }

  async getAccessToken(code: string): Promise<string> {
    const response = await axios.post('https://kauth.kakao.com/oauth/token', {
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      code: code,
    });
    return response.data.access_token;
  }

  async getUserInfo(accessToken: string): Promise<SNSUserInfo> {
    const response = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return {
      provider: 'KAKAO',
      providerUserId: response.data.id.toString(),
      email: response.data.kakao_account?.email,
      name: response.data.kakao_account?.profile?.nickname,
      profileImage: response.data.kakao_account?.profile?.profile_image_url,
    };
  }

  async validateIdToken(idToken?: string): Promise<boolean> {
    // 카카오는 ID Token 검증 로직
    return true;
  }
}
```

#### NaverAuthProvider

```typescript
class NaverAuthProvider implements SocialAuthProvider {
  private readonly clientId: string;
  private readonly redirectUri: string;
  private readonly clientSecret: string;

  async getAuthUrl(state: string): Promise<string> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      state: state,
    });
    return `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`;
  }

  async getAccessToken(code: string): Promise<string> {
    const response = await axios.post('https://nid.naver.com/oauth2.0/token', {
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      code: code,
      state: state,
    });
    return response.data.access_token;
  }

  async getUserInfo(accessToken: string): Promise<SNSUserInfo> {
    const response = await axios.get('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return {
      provider: 'NAVER',
      providerUserId: response.data.response.id,
      email: response.data.response.email,
      name: response.data.response.name,
      profileImage: response.data.response.profile_image,
    };
  }

  async validateIdToken(idToken?: string): Promise<boolean> {
    // 네이버는 ID Token 검증 로직
    return true;
  }
}
```

#### GoogleAuthProvider

```typescript
class GoogleAuthProvider implements SocialAuthProvider {
  private readonly clientId: string;
  private readonly redirectUri: string;
  private readonly clientSecret: string;

  async getAuthUrl(state: string): Promise<string> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid profile email',
      state: state,
      access_type: 'offline',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async getAccessToken(code: string): Promise<string> {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      code: code,
    });
    return response.data.access_token;
  }

  async getUserInfo(accessToken: string): Promise<SNSUserInfo> {
    const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return {
      provider: 'GOOGLE',
      providerUserId: response.data.id,
      email: response.data.email,
      name: response.data.name,
      profileImage: response.data.picture,
    };
  }

  async validateIdToken(idToken?: string): Promise<boolean> {
    // Google ID Token 검증 로직
    return true;
  }
}
```

### 3. Auth Service

```typescript
class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly socialAccountRepository: SocialAccountRepository,
    private readonly jwtService: JwtService,
    private readonly providers: Map<string, SocialAuthProvider>,
  ) {}

  async getAuthUrl(provider: string): Promise<string> {
    const authProvider = this.providers.get(provider);
    if (!authProvider) {
      throw new BadRequestException('Unsupported provider');
    }

    const state = this.generateState();
    return authProvider.getAuthUrl(state);
  }

  async handleCallback(
    provider: string,
    code: string,
    state: string,
  ): Promise<AuthResponse> {
    // State 검증
    if (!this.validateState(state)) {
      throw new BadRequestException('Invalid state');
    }

    const authProvider = this.providers.get(provider);
    if (!authProvider) {
      throw new BadRequestException('Unsupported provider');
    }

    // Access Token 획득
    const accessToken = await authProvider.getAccessToken(code);

    // 사용자 정보 조회
    const snsUserInfo = await authProvider.getUserInfo(accessToken);

    // 기존 사용자 확인
    let user = await this.findUserBySNS(
      provider,
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
        createdAt: user.createdAt,
      },
    };
  }

  async refreshTokens(refreshToken: string): Promise<TokenResponse> {
    // Refresh Token 검증
    const payload = this.jwtService.verify(refreshToken, {
      secret: process.env.JWT_REFRESH_SECRET,
    });

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
    await this.revokeRefreshToken(userId, refreshToken);
  }

  private async findUserBySNS(
    provider: string,
    providerUserId: string,
  ): Promise<User | null> {
    const socialAccount = await this.socialAccountRepository.findOne({
      where: { provider, providerUserId },
      relations: ['user'],
    });
    return socialAccount?.user || null;
  }

  private async createUser(
    snsUserInfo: SNSUserInfo,
  ): Promise<User> {
    const user = this.userRepository.create({
      name: snsUserInfo.name,
      status: 'ACTIVE',
    });
    return this.userRepository.save(user);
  }

  private async linkSocialAccount(
    userId: number,
    snsUserInfo: SNSUserInfo,
  ): Promise<void> {
    const existing = await this.socialAccountRepository.findOne({
      where: {
        provider: snsUserInfo.provider,
        providerUserId: snsUserInfo.providerUserId,
      },
    });

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
    const payload = { sub: userId };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
      secret: process.env.JWT_SECRET,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: process.env.JWT_REFRESH_SECRET,
    });

    // Refresh Token 저장
    await this.saveRefreshToken(userId, refreshToken);

    return { accessToken, refreshToken };
  }

  private generateState(): string {
    return randomBytes(32).toString('hex');
  }

  private validateState(state: string): boolean {
    // Redis에 저장된 state와 비교
    return true;
  }
}
```

## JWT 토큰

### Access Token
- 만료: 15분
- 용도: API 인증
- 전달 방식: Authorization Header (Bearer)

### Refresh Token
- 만료: 7일
- 용도: Access Token 갱신
- 전달 방식: HttpOnly + Secure Cookie

### 토큰 Payload
```json
{
  "sub": "user_id",
  "iat": 1234567890,
  "exp": 1234567890
}
```

## 보안

### 1. OAuth State 검증
CSRF 방지를 위해 random state를 생성하고 검증합니다.

### 2. PKCE (Proof Key for Code Exchange)
추가 보안을 위해 PKCE를 사용합니다.

### 3. HttpOnly + Secure Cookie
Refresh Token은 HttpOnly + Secure Cookie로 전달하여 XSS 방지합니다.

### 4. 환경변수 관리
SNS Client Secret과 API Key는 환경변수로 관리합니다.

```env
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
KAKAO_REDIRECT_URI=

NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
NAVER_REDIRECT_URI=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

JWT_SECRET=
JWT_REFRESH_SECRET=
```

### 5. Refresh Token 저장
Refresh Token은 DB에 저장하여 폐기 가능하도록 합니다.

## 다중 SNS 계정 연결

한 명의 사용자가 여러 SNS 계정을 연결할 수 있습니다.

```typescript
// 사용자가 다른 SNS로 로그인 시
async handleAdditionalSNSLogin(
  userId: number,
  provider: string,
  code: string,
  state: string,
): Promise<void> {
  const authProvider = this.providers.get(provider);
  const accessToken = await authProvider.getAccessToken(code);
  const snsUserInfo = await authProvider.getUserInfo(accessToken);

  // 기존 연결 확인
  const existing = await this.socialAccountRepository.findOne({
    where: {
      provider: snsUserInfo.provider,
      providerUserId: snsUserInfo.providerUserId,
    },
  });

  if (!existing) {
    // 새로운 SNS 계정 연결
    await this.linkSocialAccount(userId, snsUserInfo);
  }
}
```

## 로그아웃

로그아웃 시:
1. Refresh Token 폐기 (DB에서 삭제)
2. 클라이언트 쿠키 삭제

```typescript
async logout(userId: number, refreshToken: string): Promise<void> {
  await this.revokeRefreshToken(userId, refreshToken);
}
```

## 자동 로그인

Refresh Token이 유효한 경우 자동으로 Access Token을 갱신합니다.

```typescript
async refreshAccessToken(refreshToken: string): Promise<string> {
  const { accessToken } = await this.refreshTokens(refreshToken);
  return accessToken;
}
```

## 에러 처리

| 에러 | 설명 |
|-----|------|
| UNSUPPORTED_PROVIDER | 지원하지 않는 Provider |
| INVALID_STATE | State 검증 실패 |
| INVALID_CODE | OAuth 코드 유효하지 않음 |
| TOKEN_ERROR | 토큰 획득 실패 |
| USER_INFO_ERROR | 사용자 정보 조회 실패 |
| INVALID_REFRESH_TOKEN | Refresh Token 유효하지 않음 |

## 확장성

새로운 SNS Provider 추가 시:
1. `SocialAuthProvider` 인터페이스 구현
2. `providers` Map에 등록
3. 환경변수 설정
4. API 엔드포인트 추가

기존 로직 수정 없이 확장 가능합니다.
