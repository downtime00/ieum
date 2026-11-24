import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 가족 게시판 투표 — family_polls + family_poll_votes 테이블 추가.
 */
export class BoardPolls1760000000005 implements MigrationInterface {
  name = 'BoardPolls1760000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "family_polls" (
        "id" BIGSERIAL NOT NULL,
        "family_id" BIGINT NOT NULL,
        "author_user_id" BIGINT NOT NULL,
        "author_name" VARCHAR(100) NOT NULL,
        "question" VARCHAR(300) NOT NULL,
        "options" JSONB NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_family_polls_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_family_polls_family" ON "family_polls" ("family_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "family_poll_votes" (
        "id" BIGSERIAL NOT NULL,
        "poll_id" BIGINT NOT NULL,
        "user_id" BIGINT NOT NULL,
        "option_index" INT NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_family_poll_votes_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_family_poll_votes_poll_user" UNIQUE ("poll_id", "user_id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_family_poll_votes_poll" ON "family_poll_votes" ("poll_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "family_poll_votes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "family_polls"`);
  }
}
