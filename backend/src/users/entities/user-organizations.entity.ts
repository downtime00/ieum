import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';

export enum OrganizationStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

@Entity('user_organizations')
export class UserOrganizations {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', nullable: false })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'bigint', nullable: false })
  organizationId: number;

  @ManyToOne(() => Organization, (org) => org.userOrganizations)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ type: 'varchar', length: 20, default: OrganizationStatus.ACTIVE })
  status: OrganizationStatus;

  @Column({ type: 'timestamptz' })
  connectedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  disconnectedAt?: Date | null;
}