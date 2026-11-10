# Security

## 개요
서비스의 보안을 위한 필수 보안 조치와 모범 사례를 정의합니다.

## 필수 보안 조치

### 1. HTTPS
- 모든 API 요청은 HTTPS를 통해서만 허용
- HTTP 요청은 HTTPS로 리다이렉트
- TLS 1.2 이상 사용

### 2. OAuth State 검증
CSRF 방지를 위해 random state를 생성하고 검증합니다.

```typescript
class AuthService {
  private generateState(): string {
    return randomBytes(32).toString('hex');
  }

  private async saveState(state: string): Promise<void> {
    await this.redisService.setex(`oauth:state:${state}`, 600, state);
  }

  private async validateState(state: string): Promise<boolean> {
    const saved = await this.redisService.get(`oauth:state:${state}`);
    if (saved) {
      await this.redisService.del(`oauth:state:${state}`);
      return true;
    }
    return false;
  }
}
```

### 3. PKCE (Proof Key for Code Exchange)
추가 보안을 위해 PKCE를 사용합니다.

```typescript
class AuthService {
  async generatePKCE(): Promise<{ codeVerifier: string; codeChallenge: string }> {
    const codeVerifier = randomBytes(32).toString('base64url');
    const codeChallenge = await this.sha256(codeVerifier);

    return { codeVerifier, codeChallenge };
  }

  private async sha256(message: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}
```

### 4. JWT (JSON Web Token)
Access Token과 Refresh Token에 JWT를 사용합니다.

#### Access Token
- 만료: 15분
- 알고리즘: HS256
- Secret: 환경변수

#### Refresh Token
- 만료: 7일
- 알고리즘: HS256
- Secret: 별도 환경변수
- 저장: DB + HttpOnly + Secure Cookie

```typescript
class JwtService {
  generateAccessToken(userId: number): string {
    const payload = { sub: userId };
    return sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
  }

  generateRefreshToken(userId: number): string {
    const payload = { sub: userId };
    return sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  }

  verifyAccessToken(token: string): JwtPayload {
    return verify(token, process.env.JWT_SECRET);
  }

  verifyRefreshToken(token: string): JwtPayload {
    return verify(token, process.env.JWT_REFRESH_SECRET);
  }
}
```

### 5. HttpOnly + Secure Cookie
Refresh Token은 HttpOnly + Secure Cookie로 전달합니다.

```typescript
class AuthService {
  setRefreshTokenCookie(res: Response, refreshToken: string): void {
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
      path: '/',
    });
  }

  clearRefreshTokenCookie(res: Response): void {
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
  }
}
```

### 6. CORS (Cross-Origin Resource Sharing)
허용된 도메인에서만 API 호출을 허용합니다.

```typescript
// main.ts
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### 7. Rate Limiting
API 요청 수를 제한합니다.

```typescript
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1분
        limit: 100, // 100회
      },
    ]),
  ],
})
class AppModule {}

// 특정 엔드포인트에 더 엄격한 제한
@Throttle({ default: { limit: 10, ttl: 60000 } })
@Post('auth/login')
async login() {
  // 로그인은 1분에 10회로 제한
}
```

### 8. RBAC (Role-Based Access Control)
역할 기반 접근 제어를 구현합니다.

```typescript
enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

@Injectable()
class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<Role[]>(
      'roles',
      context.getHandler(),
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return requiredRoles.some(role => user.role === role);
  }
}

// 사용 예
@Post('admin/users')
@Roles(Role.ADMIN)
@UseGuards(RolesGuard)
async createAdminUser() {
  // 관리자만 접근 가능
}
```

### 9. Permission Check
가족 기능 등에서 명시적 권한 확인을 수행합니다.

```typescript
@Injectable()
class FamilyPermissionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user.id;
    const targetUserId = request.params.userId;
    const requiredPermission = request.requiredPermission;

    const hasPermission = await this.familyService.hasPermission(
      userId,
      targetUserId,
      requiredPermission,
    );

    if (!hasPermission) {
      throw new ForbiddenException('권한이 없습니다.');
    }

    return true;
  }
}
```

### 10. Input Validation
모든 입력에 대한 유효성 검사를 수행합니다.

```typescript
class CreateUserDto {
  @IsString()
  @IsLength(1, 100)
  @Matches(/^[가-힣a-zA-Z\s]+$/)
  name: string;

  @IsOptional()
  @IsDateString()
  birthDate: string;

  @IsOptional()
  @IsString()
  @IsLength(10, 20)
  @Matches(/^010-\d{4}-\d{4}$/)
  phone: string;
}
```

### 11. SQL Injection 방어
ORM을 사용하여 SQL Injection을 방지합니다.

```typescript
// 안전한 방법 (ORM 사용)
const users = await this.userRepository.find({
  where: { name: Like(`%${keyword}%`) },
});

// 위험한 방법 (사용 금지)
const users = await this.userRepository.query(
  `SELECT * FROM users WHERE name LIKE '%${keyword}%'`,
);
```

### 12. XSS 방어
사용자 입력을 적절히 이스케이프 처리합니다.

```typescript
import * as sanitizeHtml from 'sanitize-html';

class ContentService {
  sanitizeDescription(description: string): string {
    return sanitizeHtml(description, {
      allowedTags: ['b', 'i', 'u', 'br', 'p'],
      allowedAttributes: {},
    });
  }
}
```

### 13. CSRF 방어
SameSite Cookie와 CSRF Token을 사용합니다.

```typescript
// main.ts
app.use(csurf({ cookie: { httpOnly: true, secure: true } }));

// Controller
@Post('contents')
@UseGuards(CsrfGuard)
async createContent(@Body() body: CreateContentDto) {
  // CSRF 토큰 검증
}
```

### 14. Audit Log
보안 관련 이벤트를 로깅합니다.

```typescript
class AuditService {
  async logSecurityEvent(
    userId: number,
    event: string,
    details: any,
  ): Promise<void> {
    await this.auditLogRepository.save({
      userId,
      event,
      details,
      ipAddress: this.getClientIp(),
      userAgent: this.getUserAgent(),
      timestamp: new Date(),
    });
  }

  async logFailedLogin(email: string): Promise<void> {
    await this.logSecurityEvent(null, 'FAILED_LOGIN', { email });
  }

  async logPermissionDenied(
    userId: number,
    resource: string,
  ): Promise<void> {
    await this.logSecurityEvent(userId, 'PERMISSION_DENIED', { resource });
  }
}
```

## 환경변수 관리

### 환경변수 목록

```env
# Database
DATABASE_URL=
REDIS_URL=

# JWT
JWT_SECRET=
JWT_REFRESH_SECRET=

# SNS OAuth
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
KAKAO_REDIRECT_URI=

NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
NAVER_REDIRECT_URI=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# External APIs
CULTURE_API_KEY=

# Web Push
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=

# Security
ALLOWED_ORIGINS=
NODE_ENV=
```

### 환경변수 보안
- .env 파일은 Git에 commit하지 않음
- .env.example 파일만 Git에 포함
- 프로덕션에서는 안전한 비밀 관리 시스템 사용 (AWS Secrets Manager, etc.)

## 개인정보 보호

### 1. 최소 수집 원칙
불필요한 개인정보를 수집하지 않습니다.

### 2. 데이터 암호화
- 민감 데이터는 DB에서 암호화 저장
- 전송 중 데이터는 TLS로 암호화

```typescript
class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

  encrypt(text: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedText: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
```

### 3. 데이터 보유 기간
- 불필요한 개인정보는 정기적으로 삭제
- 법적 요구사항에 따라 보유 기간 설정

### 4. 데이터 접근 제어
- 개인정보 접근 로그 기록
- 필요한 인원만 접근 허용

## API 보안

### 1. 인증 미들웨어

```typescript
@Injectable()
class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('토큰이 없습니다.');
    }

    try {
      const payload = await this.jwtService.verifyAccessToken(token);
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

### 2. 헬퍼 체크
민감한 작업 전 헬퍼 체크 수행.

```typescript
@Injectable()
class HelperCheckGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user.id;

    const recentLogins = await this.auditService.getRecentLogins(userId, 24);
    const isNewDevice = await this.deviceService.isNewDevice(userId, request);

    if (recentLogins.length === 0 || isNewDevice) {
      // 추가 인증 필요
      throw new ForbiddenException('추가 인증이 필요합니다.');
    }

    return true;
  }
}
```

## 외부 API 보안

### 1. API Key 보호
- API Key는 환경변수로 관리
- 소스코드에 하드코딩 금지

### 2. Rate Limiting 준수
- 외부 API의 Rate Limit을 준수
- 재시도 로직 구현

### 3. 에러 처리
- 외부 API 에러 시 민감 정보 노출 금지
- 일반적인 에러 메시지 사용

## 로깅 및 모니터링

### 1. 보안 이벤트 로깅
- 로그인 실패
- 권한 거부
- 의심스러운 활동
- 데이터 접근

### 2. 실시간 모니터링
- 이상 징후 탐지
- 자동 알림
- 빠른 대응

## 정기 보안 점검

### 1. 취약점 스캔
- 정기적인 취약점 스캔
- 의존성 업데이트

### 2. 보안 감사
- 정기적인 보안 감사
- 코드 리뷰

### 3. 침투 테스트
- 정기적인 침투 테스트
- 보안 강화

## 비상 대응

### 1. 보안 사고 대응 계획
- 보안 사고 시 대응 절차
- 담당자 연락망
- 복구 절차

### 2. 데이터 유출 대응
- 영향 범위 파악
- 사용자 통지
- 법적 조치

## 요약

- HTTPS 필수
- OAuth State + PKCE
- JWT + HttpOnly Cookie
- CORS + Rate Limiting
- RBAC + Permission Check
- Input Validation
- SQL Injection + XSS 방어
- CSRF 방어
- Audit Log
- 환경변수 보안
- 개인정보 보호
- 정기 보안 점검
