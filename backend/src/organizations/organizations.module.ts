import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { UserOrganization } from './entities/user-organization.entity';
import { OrganizationRepository } from './organization.repository';
import { UserOrganizationRepository } from './user-organization.repository';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, UserOrganization]),
  ],
  providers: [
    OrganizationRepository,
    UserOrganizationRepository,
    OrganizationsService,
  ],
  controllers: [OrganizationsController],
  exports: [
    OrganizationRepository,
    UserOrganizationRepository,
    OrganizationsService,
  ],
})
export class OrganizationsModule {}
