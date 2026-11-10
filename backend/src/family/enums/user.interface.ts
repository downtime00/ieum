import { Request } from 'express';
import { FamilyRole, Permission } from '../enums/role.enum';

/**
 * 인증된 사용자 인터페이스
 */
export interface AuthenticatedUser {
  id: number;
  email: string;
  name?: string;
  role?: string;           // 가계원 역할 (ADMIN/HEAD/MEMBER)
  permissions?: Permission[]; // 추가 권한 목록
}

/**
 * Express Request 인터페이스 확장
 */
export interface FamilyRequest extends Request {
  user: AuthenticatedUser | null;
}