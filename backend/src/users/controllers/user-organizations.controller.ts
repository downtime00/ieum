import { Controller } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserOrganizations, OrganizationStatus } from '../entities/user-organizations.entity';
import { CreateUserOrganizationDto } from '../dto/create-user-organization.dto';

@Controller('user-organizations')
export class UserOrganizationsController {
  constructor(
    @InjectRepository(UserOrganizations)
    private readonly repository: Repository<UserOrganizations>,
  ) {}

  async create(createUserOrganizationDto: CreateUserOrganizationDto): Promise<UserOrganizations> {
    return this.repository.save({ ...createUserOrganizationDto });
  }

  async disconnect(userId: number, organizationId: number): Promise<void> {
    await this.repository.update(
      { userId, organizationId },
      { status: OrganizationStatus.INACTIVE, disconnectedAt: new Date() },
    );
  }
}