import { SetMetadata } from '@nestjs/common';
import { FamilyRole } from '../enums/role.enum';
import { Permission } from '../enums/permission.enum';

/**
 * @Roles() Decorator - 역할 기반 접근 제어 (RBAC)
 * 
 * 예시:
 * ```typescript
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles(FamilyRole.HEAD)  // HEAD 역할만 가능
 * @Post('invite-code')
 * async createInviteCode(@Body() body: CreateFamilyDto) { }
 * ```
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: FamilyRole[]) => SetMetadata(ROLES_KEY, roles);

/**
 * @RequirePermissions() Decorator - 권한 기반 접근 제어 (ABAC)  
 * 
 * 예시:
 * ```typescript
 * @UseGuards(JwtAuthGuard, PermissionsGuard)
 * @RequirePermissions('FAMILY_CREATE')  // 특정 권한 필수
 * @Post()
 * async createFamily(@Body() dto: CreateFamilyDto) { }
 * ```
 */
export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * 가족 정보 조회 - 모든 사용자 가능 (로그인 후)
 */
export const FAMILY_LIST_ROLES = [FamilyRole.MEMBER];

/**
 * 가족 생성 - 초대 코드 만 가능 또는 ADMIN 역할 필요
 */
export const FAMILY_CREATE_PERMISSIONS = ['FAMILY_CREATE'];

/**
 * 가족 정보 수정 - HEAD 역할만 가능
 */
export const FAMILY_UPDATE_ROLES = [FamilyRole.HEAD];

/**
 * 구성원 추가 - HEAD 만 가능
 */
export const MEMBER_ADD_ROLES = [FamilyRole.HEAD];

/**
 * 초대 코드 생성 - ADMIN 또는 HEAD 만 가능
 */
export const INVITE_CODE_GENERATE_ROLES = [FamilyRole.ADMIN, FamilyRole.HEAD];