import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/auth.decorators';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // @ts-expect-error - NestJS Reflector 타입 정의의 문제로 known issue
    const permissions = this.reflector.getAllAndMerge(PERMISSIONS_KEY, context) as any;

    if (!permissions) return true; // 권한 제한 없음

    const request = context.switchToHttp().getRequest();
    const user = request.user as { permissions?: string[] };

    if (!user?.permissions || !Array.isArray(user.permissions)) {
      return false;
    }

    return permissions.some(perm => user.permissions.includes(perm));
  }
}