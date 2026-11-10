import { Controller, Get, Post, Body, Param, NotFoundException, UsePipes, UseGuards } from '@nestjs/common';
import { FamilyService } from '../services/family.service';
import { createFamilySchema, updateFamilySchema, removeMemberSchema, type CreateFamilyDto, type FamilyInviteCodeResponse } from '../services/family.service';
import { FamilyMember } from '../entities/family-member.entity';
import { Family } from '../entities/family.entity';
import { ZodValidationPipe } from '../../common/validation/zod.validation.pipe';
import { RolesGuard, PermissionsGuard } from '../guards';
import { ROLES_KEY, PERMISSIONS_KEY, Roles } from '../decorators';
import { FamilyRole } from '../enums/role.enum';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

type InviteCodeBody = { expiresAt?: string | Date };

@Controller('family')
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(FamilyRole.ADMIN)  // ADMIN 만 새 가족 생성
  @UsePipes(new ZodValidationPipe(createFamilySchema))
  async create(@Body() familyData: CreateFamilyDto): Promise<Family> {
    const created = await this.familyService.create(familyData);
    return created;
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(FamilyRole.MEMBER)  // 모든 로그인 사용자 가능 (MEMBER 이상)
  async findOne(@Param('id') id: string): Promise<any> {
    return this.familyService.findOne(parseInt(id));
  }

  @Post(':id/invite-code')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(FamilyRole.ADMIN, FamilyRole.HEAD)  // 초대 코드 생성은 ADMIN 또는 HEAD 만 가능
  async generateInviteCode(
    @Param('id') id: string,
    @Body() body?: InviteCodeBody,
  ): Promise<FamilyInviteCodeResponse> {
    // expiresAt 이 string 인 경우 Date 로 변환
    const expiresAt = body?.expiresAt
      ? typeof body.expiresAt === 'string'
        ? new Date(body.expiresAt)
        : body.expiresAt
      : null;

    const inviteCode = await this.familyService.generateInviteCode(parseInt(id), {
      expiresAt,
    });

    return {
      code: inviteCode.code,
      familyId: inviteCode.familyId,
      createdAt: new Date().toISOString(),
      expiresAt: inviteCode.expiresAt,
    };
  }

  @Get(':id/invite-code')
  @UseGuards(JwtAuthGuard)
  async inviteByCode(@Param('code') code: string): Promise<FamilyInviteCodeResponse> {
    // 가족 가입은 누구나 가능 (초대 코드만 있으면 됨)
    const inviteCode = await this.familyService.inviteByCode(code);

    return {
      code: inviteCode.code,
      familyId: inviteCode.familyId,
      expiresAt: inviteCode.expiresAt,
    };
  }

  @Post(':id/members')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(FamilyRole.HEAD)  // 가족 구성원 추가는 HEAD 만 가능
  async addMember(
    @Param('id') familyId: string,
    @Body() memberData: Partial<{ name: string }> & { name?: string },
  ): Promise<FamilyMember> {
    return this.familyService.addMember(parseInt(familyId), memberData);
  }

  @Post('members/:memberId/remove')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(FamilyRole.HEAD)  // 구성원 제거는 HEAD 만 가능
  async removeMember(@Param('memberId') memberId: string): Promise<void> {
    return this.familyService.removeMember(parseInt(memberId));
  }
}
