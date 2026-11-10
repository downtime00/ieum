import { IsNotEmpty, IsEnum, IsDateString } from 'class-validator';
import { OrganizationStatus } from '../entities/user-organizations.entity';

export class CreateUserOrganizationDto {
  @IsNotEmpty()
  organizationId: number;

  @IsNotEmpty()
  @IsEnum(OrganizationStatus)
  status: OrganizationStatus;

  connectedAt: Date;
}