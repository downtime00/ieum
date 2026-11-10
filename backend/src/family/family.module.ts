import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FamilyMember } from './entities/family-member.entity';
import { Family } from './entities/family.entity';
import { FamilyInviteCode } from './entities/family-invite-code.entity';
import { FamilyService } from './services/family.service';
import { FamilyController } from './controllers/family.controller';
import { RolesGuard, PermissionsGuard } from './guards';

@Module({
  imports: [TypeOrmModule.forFeature([Family, FamilyMember, FamilyInviteCode])],
  controllers: [FamilyController],
  providers: [
    FamilyService,
    RolesGuard,
    PermissionsGuard,
  ],
  exports: [FamilyService, RolesGuard, PermissionsGuard],
})
export class FamilyModule {}