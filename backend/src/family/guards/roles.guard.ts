import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/auth.decorators';
import { FamilyRole } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // @ts-expect-error - NestJS Reflector 타입 정의의 문제로 known issue
    const roles = this.reflector.getAllAndMerge(ROLES_KEY, context) as any;

    if (!roles) return true; // 역할 제한 없음

    const request = context.switchToHttp().getRequest();
    const user = request.user as { role?: string };

    if (!user?.role) {
      return false;
    }

    return roles.some(role => user.role === role);
  }
}