import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../users/entities/user.entity';

/**
 * Authorization: Bearer <JWT> 를 검증하고, 요청에 포함된 userId가
 * 토큰의 sub와 일치하는지 확인한다.
 * userId는 body.userId / query.userId / params.userId 순으로 탐색.
 */
export function authenticateRequest(req: any): number {
  const header = req.headers?.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new UnauthorizedException('로그인이 필요합니다');
  let payload: any;
  try {
    payload = verify(token, process.env.JWT_SECRET as string);
  } catch {
    throw new UnauthorizedException('유효하지 않거나 만료된 토큰입니다');
  }
  const userId = Number(payload?.sub);
  if (!userId) throw new UnauthorizedException('유효하지 않은 토큰입니다');

  const claimed = Number(
    req.body?.userId ?? req.query?.userId ?? req.params?.userId,
  );
  if (claimed && claimed !== userId) {
    throw new ForbiddenException('본인 계정으로만 요청할 수 있습니다');
  }
  req.userId = userId;
  return userId;
}

@Injectable()
export class UserAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    authenticateRequest(context.switchToHttp().getRequest());
    return true;
  }
}

/** 관리자 전용 — JWT 유효 + users.role이 ADMIN/SUPER_ADMIN */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = authenticateRequest(req);
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || ![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role)) {
      throw new ForbiddenException('관리자 권한이 필요합니다');
    }
    return true;
  }
}
