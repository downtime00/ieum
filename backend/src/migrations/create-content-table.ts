import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContentTable1729843605989 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // content 테이블
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "content" (
      "id" SERIAL PRIMARY KEY,
      "area_code" VARCHAR(1) NOT NULL,
      "culture_facility_name" VARCHAR(255) NOT NULL,
      "culture_facility_category" VARCHAR(100),
      "culture_facility_type" VARCHAR(100),
      "culture_content_name" VARCHAR(255) NOT NULL,
      "culture_content_detail" TEXT,
      "culture_content_url" VARCHAR(500),
      "culture_content_image" VARCHAR(500),
      "culture_content_date" DATE,
      "culture_content_location" VARCHAR(255),
      "culture_content_latitude" NUMERIC(10, 7),
      "culture_content_longitude" NUMERIC(10, 7),
      "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // users 테이블
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "users" (
      "id" BIGSERIAL PRIMARY KEY,
      "name" VARCHAR(100),
      "birth_date" DATE,
      "status" VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL,
      "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // organizations 테이블
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "organizations" (
      "id" BIGSERIAL PRIMARY KEY,
      "type" VARCHAR(30) NOT NULL,
      "name" VARCHAR(200) NOT NULL,
      "address" TEXT,
      "phone" VARCHAR(30),
      "latitude" NUMERIC(10, 7),
      "longitude" NUMERIC(10, 7),
      "status" VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL,
      "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // user_social_accounts 테이블
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "user_social_accounts" (
      "id" BIGSERIAL PRIMARY KEY,
      "user_id" BIGINT NOT NULL,
      "provider" VARCHAR(20) NOT NULL,
      "provider_user_id" VARCHAR(255) NOT NULL,
      "email" VARCHAR(255),
      "profile_name" VARCHAR(255),
      "profile_image" TEXT,
      "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // family 테이블
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "family" (
      "id" BIGSERIAL PRIMARY KEY,
      "region_name" VARCHAR(255),
      "region_level_1" VARCHAR(50) NOT NULL,
      "region_level_2" VARCHAR(50) NOT NULL,
      "region_level_3" VARCHAR(100),
      "population" INTEGER,
      "area_km2" NUMERIC(10, 2),
      "households" INTEGER,
      "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // family_member 테이블
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "family_member" (
      "id" BIGSERIAL PRIMARY KEY,
      "family_id" BIGINT NOT NULL,
      "user_id" BIGINT NOT NULL,
      "role" VARCHAR(20) DEFAULT 'HEAD',
      "is_active" BOOLEAN DEFAULT TRUE NOT NULL,
      "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // notifications 테이블
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "notifications" (
      "id" BIGSERIAL PRIMARY KEY,
      "user_id" BIGINT NOT NULL,
      "title" VARCHAR(255) NOT NULL,
      "content" TEXT NOT NULL,
      "type" VARCHAR(50),
      "priority" SMALLINT DEFAULT 1,
      "is_read" BOOLEAN DEFAULT FALSE,
      "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "read_at" TIMESTAMP
    )`);

    // user_interests 테이블
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "user_interests" (
      "id" BIGSERIAL PRIMARY KEY,
      "user_id" BIGINT NOT NULL,
      "category" VARCHAR(100),
      "interest" TEXT,
      "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // content_tags 테이블
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "content_tags" (
      "id" BIGSERIAL PRIMARY KEY,
      "name" VARCHAR(100) NOT NULL UNIQUE,
      "color" VARCHAR(7),
      "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // tag_content_mapping 테이블
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "tag_content_mapping" (
      "id" BIGSERIAL PRIMARY KEY,
      "tag_id" BIGINT NOT NULL,
      "content_id" BIGINT NOT NULL,
      "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // user_organizations 테이블
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "user_organizations" (
      "user_id" BIGINT NOT NULL,
      "organization_id" BIGINT NOT NULL,
      "status" VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL,
      "connected_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "disconnected_at" TIMESTAMP,
      PRIMARY KEY ("user_id", "organization_id")
    )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "tag_content_mapping"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "content_tags"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_organizations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_interests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "family_member"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "family"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "content"`);
  }
}