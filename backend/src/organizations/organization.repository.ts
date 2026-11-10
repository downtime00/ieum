import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';

@Injectable()
export class OrganizationRepository {
  constructor(
    @InjectRepository(Organization)
    private readonly repository: Repository<Organization>,
  ) {}

  create(organization: Partial<Organization>): Organization {
    return this.repository.create(organization);
  }

  async save(organization: Organization): Promise<Organization> {
    return this.repository.save(organization);
  }

  async remove(organization: Organization): Promise<void> {
    await this.repository.remove(organization);
  }

  async findOne(id: string | number): Promise<Organization | null> {
    return this.repository.findOne({ 
      where: { id: Number(id) } as any 
    });
  }

  /**
   * 조직 ID 로 사용자와 연결된 조직 조회 (user-organization.repository 에서 제공)
   */
  async findByOrgId(organizationId: string | number): Promise<any[]> {
    // TODO: 실제 구현 - user-organization.repository 를 호출해야 함
    return [];
  }

  /**
   * 고유 필드 (예：이름) 로 조회
   */
  async findOneByAny(whereConditions: { [key: string]: any }): Promise<Organization | null> {
    const conditions = Object.entries(whereConditions).filter(([_, value]) => value !== undefined && value !== null);
    if (conditions.length === 0) return null;

    const queryBuilder = this.repository.createQueryBuilder('org');
    conditions.forEach(([key, value]) => {
      queryBuilder.andWhere(`org.${key} = :${key}`, { [key]: value });
    });

    return queryBuilder.getOne();
  }

  findAll(options?: {
    type?: string;
    region?: string;
    district?: string;
    status?: string;
  }): Promise<Organization[]> {
    const queryBuilder = this.repository.createQueryBuilder('org');

    if (options?.type) {
      queryBuilder.andWhere('org.type = :type', { type: options.type });
    }

    if (options?.status) {
      queryBuilder.andWhere('org.status = :status', { status: options.status });
    }

    if (options?.region) {
      queryBuilder.andWhere('org.address LIKE :region', { region: `%${options.region}%` });
    }

    if (options?.district) {
      queryBuilder.andWhere('org.address LIKE :district', { district: `%${options.district}%` });
    }

    return queryBuilder.getMany();
  }
}
