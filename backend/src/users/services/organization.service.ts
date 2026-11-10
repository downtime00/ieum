import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Organization } from '../entities/organization.entity';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { UpdateOrganizationDto } from '../dto/update-organization.dto';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  async create(createOrganizationDto: CreateOrganizationDto): Promise<Organization> {
    const data = { ...createOrganizationDto, status: 'ACTIVE' };
    return this.organizationRepository.save(data);
  }

  async findAll(): Promise<Organization[]> {
    return this.organizationRepository.find({
      where: { status: 'ACTIVE' },
      order: { createdAt: 'DESC' },
    });
  }

  async findByType(type: string): Promise<Organization[]> {
    return this.organizationRepository.find({
      where: { type, status: 'ACTIVE' },
    });
  }

  async findOne(id: number): Promise<Organization> {
    const org = await this.organizationRepository.findOne({
      where: { id, status: 'ACTIVE' },
    });

    if (!org) {
      throw new NotFoundException('기관을 찾을 수 없습니다');
    }

    return org;
  }

  async update(
    id: number,
    updateOrganizationDto: UpdateOrganizationDto,
  ): Promise<Organization> {
    const existing = await this.organizationRepository.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException('기관을 찾을 수 없습니다');
    }

    return this.organizationRepository.save({ ...existing, ...updateOrganizationDto });
  }

  async remove(id: number): Promise<void> {
    const existing = await this.organizationRepository.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException('기관을 찾을 수 없습니다');
    }

    await this.organizationRepository.update(id, { status: 'INACTIVE' });
  }

  async search(query: string): Promise<Organization[]> {
    const likePattern = `%${query}%`;
    return this.organizationRepository.find({
      where: {
        name: Like(likePattern),
        status: 'ACTIVE',
      },
    });
  }
}