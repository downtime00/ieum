import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * operator_org_types — 기관 유형 마스터 테이블 + 기본값 시드.
 * Redis 캐시(operators:org_types)와 함께 사용.
 */
export class OperatorOrgTypes1760000000002 implements MigrationInterface {
  name = 'OperatorOrgTypes1760000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "operator_org_types" (
      "id" BIGSERIAL PRIMARY KEY,
      "name" VARCHAR(50) NOT NULL UNIQUE,
      "group" VARCHAR(20) NOT NULL,
      "sort_order" INT NOT NULL DEFAULT 0,
      "is_active" BOOLEAN NOT NULL DEFAULT true,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);

    const seeds: Array<[string, string, number]> = [
      ['행복복지센터', 'institution', 1],
      ['실버타운', 'institution', 2],
      ['노인회관', 'institution', 3],
      ['복지관', 'institution', 4],
      ['요양보호사', 'individual', 1],
      ['간병인', 'individual', 2],
      ['강사', 'individual', 3],
      ['기타', 'individual', 4],
    ];
    for (const [name, group, sortOrder] of seeds) {
      await queryRunner.query(
        `INSERT INTO "operator_org_types" ("name", "group", "sort_order")
         VALUES ($1, $2, $3) ON CONFLICT ("name") DO NOTHING`,
        [name, group, sortOrder],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "operator_org_types"`);
  }
}
