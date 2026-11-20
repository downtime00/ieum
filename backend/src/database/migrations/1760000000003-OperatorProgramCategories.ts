import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * operator_program_categories — 프로그램 분류 마스터 테이블 + 기본값 시드.
 * Redis 캐시(operators:program_categories)와 함께 사용.
 */
export class OperatorProgramCategories1760000000003 implements MigrationInterface {
  name = 'OperatorProgramCategories1760000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "operator_program_categories" (
      "id" BIGSERIAL PRIMARY KEY,
      "name" VARCHAR(50) NOT NULL UNIQUE,
      "sort_order" INT NOT NULL DEFAULT 0,
      "is_active" BOOLEAN NOT NULL DEFAULT true,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);

    const seeds = ['공연', '강의', '체험', '요양·간병', '방문서비스', '기타'];
    for (let i = 0; i < seeds.length; i++) {
      await queryRunner.query(
        `INSERT INTO "operator_program_categories" ("name", "sort_order")
         VALUES ($1, $2) ON CONFLICT ("name") DO NOTHING`,
        [seeds[i], i + 1],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "operator_program_categories"`);
  }
}
