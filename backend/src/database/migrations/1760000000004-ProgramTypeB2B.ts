import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 프로그램 B2B/B2C 구분 — operator_programs.program_type 추가,
 * program_bookings.booker_operator_id 추가 (B2B 신청 기관 추적).
 */
export class ProgramTypeB2B1760000000004 implements MigrationInterface {
  name = 'ProgramTypeB2B1760000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "operator_programs" ADD COLUMN IF NOT EXISTS "program_type" VARCHAR(10) NOT NULL DEFAULT 'B2C'`,
    );
    await queryRunner.query(
      `ALTER TABLE "program_bookings" ADD COLUMN IF NOT EXISTS "booker_operator_id" BIGINT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "program_bookings" DROP COLUMN IF EXISTS "booker_operator_id"`);
    await queryRunner.query(`ALTER TABLE "operator_programs" DROP COLUMN IF EXISTS "program_type"`);
  }
}
