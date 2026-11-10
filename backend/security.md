# 🔐 IEUM - 보안 가이드라인

## 📋 현재 적용된 보안 조치

### 1. ✅ 역할 기반 접근 제어 (RBAC)
- `@Roles('ADMIN')`装饰자 사용으로 민감한 엔드포인트 보호
- SeedController 의 reset/list 는 ADMIN 역할만 접근 가능

### 2. ✅ 환경 변수 보안
- `.env` 파일이 `.gitignore` 에 포함됨
- `SEED_DATA=true` 로 샘플 데이터 자동 로드 시 제한적
- 프로덕션: `SEED_DATA=false` (기본값)

### 3. ⚠️ 개선 필요 사항:

#### 1. Cors 설정 검토
```typescript
// .env 에서 허용 도메인 명시
ALLOWED_ORIGINS=http://example.com,http://localhost:3000
```

#### 2. Rate Limiting 추가 (선택사항)
```typescript
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
```

#### 3. Helmet 사용 (프로덕션)
```bash
npm install helmet
// main.ts 에서:
app.use(helmet());
```

### 4. ⚠️ SeedController 권장사항

#### 프로덕션 배포 시:
```typescript
// 주석 처리 또는 삭제: @Controller()
export class SeedController { }
```

또는 경로 분리:
```typescript
@Controller('/admin/seed') // 인증 middleware 를 통해 보호
```

### 5. 🔒 암호화 저장 가이드

현재 샘플 데이터 password 는 bcrypt hashed 되어 ✅ 안전하지만:
- 실제로 사용 시 실제 사용자 password 나 DB 정보 절대 포함 금지
- `.env` 파일: `DB_PASSWORD` 같은 민감 정보는 `.gitignore` 필수

### 6. 🛡️ 추가 보안 강화 옵션 (선택사항)

#### API Gateway 전역 인증:
```typescript
// @Roles 가 모든 엔드포인트에 적용되도록 수정 필요
@UseGuards(RolesGuard)
```

#### Security Headers:
```typescript
import { helmet } from 'helmet';
app.use(helmet()); // XSS, clickjacking 방지
```

---

## 📊 보안 체크리스트

| 항목 | 상태 | 비고 |
|------|------|------|
| ✅ RBAC 적용 | 완료 | SeedController 는 ADMIN 만 접근 가능 |
| ✅ 환경 변수 보호 | 완료 | `.env` 는 `.gitignore` 에 포함됨 |
| ⚠️ CORS 정책 | TODO | 개발 환경용 현재 설정 ✅ |
| ⚠️ Rate Limiting | 선택사항 | API 오용 방지용 |
| ⚠️ Helmet (Headers) | 선택사항 | 보안 헤더 추가 |
| ✅ Password Hashing | 완료 | bcrypt 사용됨 |

---

## 📝 결론

현재 설정은 **개발 환경에 적합**하며:
- 프로덕션 배포 시 `SEED_DATA=false`
- 민감한 엔드포인트는 ADMIN 역할만 접근 가능하도록 보호
- 추가 보안 강화 옵션은 프로젝트 규모에 따라 선택 적용
