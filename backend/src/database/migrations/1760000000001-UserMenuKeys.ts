import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * users.menuKeys — 관리자가 지정하는 대시보드 메뉴 override (jsonb, null=자동)
 */
export class UserMenuKeys1760000000001 implements MigrationInterface {
  name = 'UserMenuKeys1760000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "menuKeys" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "menuKeys"`);
  }
}
