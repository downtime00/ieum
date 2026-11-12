import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * B2B2C 공영/요양 플랫폼 테이블 생성
 * 프로덕션(NODE_ENV=production, synchronize=false) 적용용.
 * 실행: npx typeorm migration:run -d <data-source> 또는 수동 쿼리 실행.
 */
export class CreateOperatorsTables1760000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "operators" (
      "id" BIGSERIAL PRIMARY KEY,
      "owner_user_id" BIGINT NOT NULL,
      "name" VARCHAR(200) NOT NULL,
      "org_type" VARCHAR(50) NOT NULL,
      "business_number" VARCHAR(50),
      "phone" VARCHAR(50),
      "address" VARCHAR(500),
      "description" TEXT,
      "bank_name" VARCHAR(50),
      "bank_account" VARCHAR(100),
      "account_holder" VARCHAR(100),
      "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
      "fee_rate" NUMERIC(5,2) NOT NULL DEFAULT 10,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_operators_owner" ON "operators" ("owner_user_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_operators_status" ON "operators" ("status")`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "operator_programs" (
      "id" BIGSERIAL PRIMARY KEY,
      "operator_id" BIGINT NOT NULL,
      "title" VARCHAR(200) NOT NULL,
      "description" TEXT,
      "category" VARCHAR(50) NOT NULL DEFAULT '기타',
      "event_date" DATE NOT NULL,
      "start_time" VARCHAR(10),
      "duration_min" INT,
      "price" INT NOT NULL DEFAULT 0,
      "capacity" INT NOT NULL DEFAULT 30,
      "booked_count" INT NOT NULL DEFAULT 0,
      "address" VARCHAR(500),
      "contact_phone" VARCHAR(50),
      "thumbnail_url" VARCHAR(500),
      "is_active" BOOLEAN NOT NULL DEFAULT true,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_operator_programs_operator" ON "operator_programs" ("operator_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_operator_programs_date" ON "operator_programs" ("event_date")`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "program_bookings" (
      "id" BIGSERIAL PRIMARY KEY,
      "program_id" BIGINT NOT NULL,
      "operator_id" BIGINT NOT NULL,
      "requester_user_id" BIGINT NOT NULL,
      "requester_name" VARCHAR(100),
      "family_id" BIGINT,
      "headcount" INT NOT NULL DEFAULT 1,
      "message" TEXT,
      "desired_address" VARCHAR(500),
      "desired_lat" DOUBLE PRECISION,
      "desired_lng" DOUBLE PRECISION,
      "status" VARCHAR(20) NOT NULL DEFAULT 'REQUESTED',
      "unit_price" INT NOT NULL DEFAULT 0,
      "total_amount" INT NOT NULL DEFAULT 0,
      "fee_rate" NUMERIC(5,2) NOT NULL DEFAULT 10,
      "platform_fee" INT NOT NULL DEFAULT 0,
      "operator_amount" INT NOT NULL DEFAULT 0,
      "payment_method" VARCHAR(20),
      "payer_name" VARCHAR(100),
      "paid_at" TIMESTAMPTZ,
      "completed_at" TIMESTAMPTZ,
      "settled_at" TIMESTAMPTZ,
      "cancel_reason" TEXT,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_program_bookings_program" ON "program_bookings" ("program_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_program_bookings_operator" ON "program_bookings" ("operator_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_program_bookings_requester" ON "program_bookings" ("requester_user_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_program_bookings_status" ON "program_bookings" ("status")`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "operator_reviews" (
      "id" BIGSERIAL PRIMARY KEY,
      "booking_id" BIGINT NOT NULL,
      "operator_id" BIGINT NOT NULL,
      "program_id" BIGINT NOT NULL,
      "reviewer_user_id" BIGINT NOT NULL,
      "reviewer_name" VARCHAR(100),
      "rating" INT NOT NULL,
      "comment" TEXT,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT "UQ_operator_reviews_booking" UNIQUE ("booking_id")
    )`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_operator_reviews_operator" ON "operator_reviews" ("operator_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "operator_reviews"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "program_bookings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "operator_programs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "operators"`);
  }
}
