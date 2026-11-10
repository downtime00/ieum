import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { OrganizationRepository } from './organization.repository';
import { UserOrganizationRepository } from './user-organization.repository';
import { QueryOrganizationsDto } from './dto/query-organizations.dto';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import type { CreateOrganizationDto as CreateOrganizationDtoType } from './dto/create-organization.dto';
import type { UpdateOrganizationDto as UpdateOrganizationDtoType } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: OrganizationRepository,
    private readonly userOrganizationRepository: UserOrganizationRepository,
  ) {}

  /**
   * 기관 목록 조회
   */
  async findAll(query: QueryOrganizationsDto) {
    const organizations = await this.organizationRepository.findAll({
      type: query.type,
      region: query.region,
      district: query.district,
      status: 'ACTIVE',
    });

    // 페이지네이션
    const page = query.page || 1;
    const limit = query.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      items: organizations.slice(startIndex, endIndex),
      total: organizations.length,
      page,
      limit,
    };
  }

  /**
   * 기관 단건 조회 (string 또는 number 타입 모두 지원)
   */
  async findOne(id: string | number): Promise<Organization | null> {
    const organization = await this.organizationRepository.findOne(id);
    if (!organization) {
      throw new NotFoundException('기관을 찾을 수 없습니다.');
    }
    return organization;
  }

  /**
   * 기관 생성 (Admin 전용)
   */
  async create(organizationData: CreateOrganizationDtoType): Promise<Organization> {
    const existingOrg = await this.organizationRepository.findOneByAny({
      name: organizationData.name,
    });

    if (existingOrg) {
      throw new ForbiddenException('중복된 기관 이름입니다.');
    }

    const organization = this.organizationRepository.create(organizationData);
    return this.organizationRepository.save(organization);
  }

  /**
   * 기관 수정 (Admin 전용)
   */
  async update(id: string | number, organizationData: UpdateOrganizationDtoType): Promise<Organization> {
    const existingOrg = await this.organizationRepository.findOneByAny({
      name: organizationData.name,
    });

    if (existingOrg && existingOrg.id.toString() !== id.toString()) {
      throw new ForbiddenException('중복된 기관 이름입니다.');
    }

    const organization = await this.findOne(id);
    Object.assign(organization, organizationData);
    return this.organizationRepository.save(organization);
  }

  /**
   * 기관 삭제 (Admin 전용)
   */
  async remove(id: string | number): Promise<void> {
    const organization = await this.findOne(id);
    
    // 연결된 사용자가 있는지 확인 (있는 경우 삭제 방지)
    const connectedUsers = await this.userOrganizationRepository.findByOrgId(Number(organization.id));
    if (connectedUsers && connectedUsers.length > 0) {
      throw new ForbiddenException('연결된 사용자가 있어 기관을 삭제할 수 없습니다.');
    }

    await this.organizationRepository.remove(organization);
  }

  /**
   * 기관 연결/해제 (사용자 기능)
   */
  async connect(userId: number, organizationId: string | number): Promise<any> {
    const organization = await this.findOne(organizationId);
    if (!organization) {
      throw new NotFoundException('기관을 찾을 수 없습니다.');
    }

    await this.userOrganizationRepository.connect(userId, Number(organizationId));
    return { message: '기관이 연결되었습니다.' };
  }

  async disconnect(userId: number, organizationId: string | number): Promise<any> {
    await this.userOrganizationRepository.disconnect(userId, Number(organizationId));
    return { message: '기관 연결이 해제되었습니다.' };
  }
}

