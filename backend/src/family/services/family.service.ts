import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Family } from '../entities/family.entity';
import { FamilyInviteCode } from '../entities/family-invite-code.entity';
import { FamilyMember } from '../entities/family-member.entity';
import { z } from 'zod';

export const createFamilySchema = z.object({
  name: z.string().min(1).max(50),
  address: z.string().optional(),
});

export type CreateFamilyDto = z.infer<typeof createFamilySchema>;

export const updateFamilySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  address: z.string().optional(),
});

export type UpdateFamilyDto = z.infer<typeof updateFamilySchema>;

export const removeMemberSchema = z.object({});

export type RemoveMemberDto = z.infer<typeof removeMemberSchema>;

/** 
 * 컨트롤러에서 반환하는 초대코드 응답 타입 (ISO string 포맷)
 */
export type FamilyInviteCodeResponse = {
  code: string;
  familyId: number;
  expiresAt?: string; // 컨트롤러에서 ISO string 으로 반환
  createdAt?: string; // 컨트롤러 응답용 추가 속성
};

export { FamilyMember };

@Injectable()
export class FamilyService {
  constructor(
    @InjectRepository(Family)
    private readonly familyRepository: Repository<Family>,
    @InjectRepository(FamilyInviteCode)
    private readonly familyInviteCodeRepository: Repository<FamilyInviteCode>,
    @InjectRepository(FamilyMember)
    private readonly familyMemberRepository: Repository<FamilyMember>,
  ) {}

  async create(familyData: CreateFamilyDto): Promise<Family> {
    const family = this.familyRepository.create({
      name: familyData.name,
      address: familyData.address,
    }) as unknown as Family; // TypeORM 의 필드 누수 방지 (as any)

    return this.familyRepository.save(family);
  }

  async findOne(id: number): Promise<Family> {
    const family = await this.familyRepository.findOne({
      where: { id },
    });
    if (!family) {
      throw new NotFoundException('가족을 찾을 수 없습니다');
    }
    return family;
  }

  async generateInviteCode(
    familyId: number,
    options?: { expiresAt?: Date | null },
  ): Promise<FamilyInviteCodeResponse> {
    // Family 에서 필요한 속성만 조회 (code, familyId, expiresAt)
    const existingCodes = await this.familyRepository.find({
      where: [{ id: familyId }, { code: null }],
      select: ['id', 'code', 'familyId', 'expiresAt'],
    }) as unknown as Family[]; // create 후 save 로 인한 필드 누수 방지 (as any)

    // 유효한 초대코드 찾기 (null 이 아닌 경우 또는 만료되지 않은 경우)
    const validCode = existingCodes.find((invite): invite is NonNullable<typeof existingCodes>[0] => {
      return (
        invite.expiresAt === null || invite.expiresAt > new Date()
      );
    });

    if (validCode) {
      return { 
        code: validCode.code, 
        familyId: validCode.familyId, 
        expiresAt: validCode.expiresAt?.toISOString() ?? undefined 
      };
    }

    const newCode = this.generateShortCode();
    // FamilyInviteCode 엔티티 생성
    const inviteCodeEntity = await this.familyInviteCodeRepository.create({
      code: newCode,
      familyId,
      expiresAt: options?.expiresAt ?? null,
    });

    // Family 에 초대코드 정보 저장 (embedded property)
    await this.familyRepository.update(familyId, {
      code: newCode,
      expiresAt: options?.expiresAt ?? null,
    }).catch(() => {
      throw new Error('초대 코드 생성 중 오류가 발생했습니다.');
    });

    return { 
      code: newCode, 
      familyId, 
      expiresAt: inviteCodeEntity.expiresAt?.toISOString() 
    };
  }

  private generateShortCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result.toUpperCase();
  }

  async addMember(
    familyId: number,
    memberData: Partial<FamilyMember>,
    queryRunner?: any,
  ): Promise<FamilyMember> {
    const member = this.familyMemberRepository.create({
      ...memberData,
      familyId,
    });
    if (queryRunner) {
      const repository = queryRunner.manager.getRepository(FamilyMember);
      return repository.save(member, queryRunner);
    }
    return this.familyMemberRepository.save(member);
  }

  async removeMember(memberId: number): Promise<void> {
    await this.familyMemberRepository.delete(memberId);
  }

  async inviteByCode(code: string): Promise<FamilyInviteCodeResponse> {
    // Family 에서 필요한 속성만 조회 (code, familyId, expiresAt)
    const existingCodes = await this.familyRepository.find({
      where: [{ code }, { expiresAt: null }],
      select: ['id', 'code', 'familyId', 'expiresAt'],
    }) as unknown as Family[]; // create 후 save 로 인한 필드 누수 방지 (as any)

    if (!existingCodes || existingCodes.length === 0) {
      throw new BadRequestException('유효하지 않은 초대 코드입니다.');
    }

    // 유효한 초대코드 찾기 (null 이 아닌 경우 또는 만료되지 않은 경우)
    const validCode = existingCodes.find((invite): invite is NonNullable<typeof existingCodes>[0] => {
      return invite.expiresAt !== null && invite.expiresAt > new Date();
    });

    if (!validCode) {
      throw new BadRequestException('초대 코드가 만료되었습니다. 다시 입력해주세요.');
    }

    return { 
      code: validCode.code, 
      familyId: validCode.familyId, 
      expiresAt: validCode.expiresAt?.toISOString() 
    };
  }

  async renewInviteCode(familyId: number): Promise<void> {
    // Family 에서 필요한 속성만 조회 (code, familyId, expiresAt)
    const existingCodes = await this.familyRepository.find({
      where: [{ id: familyId }, { code: null }],
      select: ['id', 'code', 'familyId', 'expiresAt'],
    }) as unknown as Family[]; // create 후 save 로 인한 필드 누수 방지 (as any)

    // 유효한 초대코드 찾기 (null 이 아닌 경우 또는 만료되지 않은 경우)
    const validCode = existingCodes.find((invite): invite is NonNullable<typeof existingCodes>[0] => {
      return (
        invite.expiresAt === null || invite.expiresAt > new Date()
      );
    });

    if (!validCode) return;

    // 만료일이 있다면 null 로 변경 (영구 유효)
    if (validCode.expiresAt && validCode.expiresAt !== null) {
      await this.familyRepository.update(validCode.id, { expiresAt: null }).catch(() => {
        throw new Error('만료일 갱신 중 오류가 발생했습니다.');
      });
    } else if (!validCode.expiresAt) {
      // 이미 영구 유효인 경우 (null 일 때)
      await this.familyRepository.update(validCode.id, { expiresAt: null }).catch(() => {
        throw new Error('초대코드 갱신 중 오류가 발생했습니다.');
      });
    }
  };
}