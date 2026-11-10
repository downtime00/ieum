import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // users
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" BIGSERIAL NOT NULL,
        "name" VARCHAR(100),
        "birth_date" DATE,
        "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_users_status" ON "users" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_users_created_at" ON "users" ("created_at")
    `);

    // user_social_accounts
    await queryRunner.query(`
      CREATE TABLE "user_social_accounts" (
        "id" BIGSERIAL NOT NULL,
        "user_id" BIGINT NOT NULL,
        "provider" VARCHAR(20) NOT NULL,
        "provider_user_id" VARCHAR(255) NOT NULL,
        "email" VARCHAR(255),
        "profile_name" VARCHAR(100),
        "profile_image" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_user_social_accounts_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_social_accounts_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "uq_social_provider_user" UNIQUE ("provider", "provider_user_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_social_accounts_user" ON "user_social_accounts" ("user_id")
    `);

    // organizations
    await queryRunner.query(`
      CREATE TABLE "organizations" (
        "id" BIGSERIAL NOT NULL,
        "type" VARCHAR(30) NOT NULL,
        "name" VARCHAR(200) NOT NULL,
        "address" TEXT,
        "phone" VARCHAR(30),
        "latitude" NUMERIC(10, 7),
        "longitude" NUMERIC(10, 7),
        "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_organizations_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_organizations_type" ON "organizations" ("type")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_organizations_status" ON "organizations" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_organizations_location" ON "organizations" ("latitude", "longitude")
    `);

    // user_organizations
    await queryRunner.query(`
      CREATE TABLE "user_organizations" (
        "user_id" BIGINT NOT NULL,
        "organization_id" BIGINT NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        "connected_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "disconnected_at" TIMESTAMPTZ,
        CONSTRAINT "PK_user_organizations" PRIMARY KEY ("user_id", "organization_id"),
        CONSTRAINT "FK_user_organizations_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_organizations_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_user_organizations_org" ON "user_organizations" ("organization_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_user_organizations_status" ON "user_organizations" ("status")
    `);

    // contents
    await queryRunner.query(`
      CREATE TABLE "contents" (
        "id" BIGSERIAL NOT NULL,
        "organization_id" BIGINT,
        "type" VARCHAR(50) NOT NULL,
        "category" VARCHAR(100),
        "title" VARCHAR(500) NOT NULL,
        "description" TEXT,
        "location" TEXT,
        "target" VARCHAR(100),
        "capacity" INTEGER,
        "start_at" TIMESTAMPTZ,
        "end_at" TIMESTAMPTZ,
        "application_start_at" TIMESTAMPTZ,
        "application_end_at" TIMESTAMPTZ,
        "source_type" VARCHAR(50) NOT NULL,
        "source_id" VARCHAR(255) NOT NULL,
        "source_url" TEXT,
        "raw_data" JSONB,
        "collected_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_contents_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_contents_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL,
        CONSTRAINT "uq_content_source" UNIQUE ("source_type", "source_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_contents_type" ON "contents" ("type")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_contents_category" ON "contents" ("category")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_contents_start_at" ON "contents" ("start_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_contents_end_at" ON "contents" ("end_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_contents_application_end_at" ON "contents" ("application_end_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_contents_organization" ON "contents" ("organization_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_contents_source" ON "contents" ("source_type", "source_id")
    `);

    // data_sources
    await queryRunner.query(`
      CREATE TABLE "data_sources" (
        "id" BIGSERIAL NOT NULL,
        "name" VARCHAR(200) NOT NULL,
        "provider" VARCHAR(100),
        "api_url" TEXT,
        "license" TEXT,
        "commercial_use" BOOLEAN,
        "redistribution_allowed" BOOLEAN,
        "attribution_required" BOOLEAN,
        "source_url" TEXT,
        "last_synced_at" TIMESTAMPTZ,
        "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_data_sources_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_data_sources_status" ON "data_sources" ("status")
    `);

    // user_interests
    await queryRunner.query(`
      CREATE TABLE "user_interests" (
        "user_id" BIGINT NOT NULL,
        "category" VARCHAR(50) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_user_interests" PRIMARY KEY ("user_id", "category"),
        CONSTRAINT "FK_user_interests_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // user_profiles
    await queryRunner.query(`
      CREATE TABLE "user_profiles" (
        "user_id" BIGINT NOT NULL,
        "region" VARCHAR(100),
        "district" VARCHAR(100),
        "phone" VARCHAR(30),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_user_profiles" PRIMARY KEY ("user_id"),
        CONSTRAINT "FK_user_profiles_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // push_subscriptions
    await queryRunner.query(`
      CREATE TABLE "push_subscriptions" (
        "id" BIGSERIAL NOT NULL,
        "user_id" BIGINT NOT NULL,
        "endpoint" TEXT NOT NULL,
        "p256dh" TEXT NOT NULL,
        "auth" TEXT NOT NULL,
        "device_uuid" VARCHAR(255),
        "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_push_subscriptions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_push_subscriptions_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_push_subscriptions_user" ON "push_subscriptions" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_push_subscriptions_device" ON "push_subscriptions" ("device_uuid")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_push_subscriptions_status" ON "push_subscriptions" ("status")
    `);

    // notifications
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" BIGSERIAL NOT NULL,
        "user_id" BIGINT NOT NULL,
        "organization_id" BIGINT,
        "type" VARCHAR(50) NOT NULL,
        "title" VARCHAR(300) NOT NULL,
        "body" TEXT NOT NULL,
        "reference_type" VARCHAR(50),
        "reference_id" BIGINT,
        "read_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notifications_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_notifications_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_notifications_user_created" ON "notifications" ("user_id", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_notifications_unread" ON "notifications" ("user_id", "read_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_notifications_reference" ON "notifications" ("reference_type", "reference_id")
    `);

    // user_relationships
    await queryRunner.query(`
      CREATE TABLE "user_relationships" (
        "id" BIGSERIAL NOT NULL,
        "user_id" BIGINT NOT NULL,
        "target_user_id" BIGINT NOT NULL,
        "relationship_type" VARCHAR(50) NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "approved_at" TIMESTAMPTZ,
        CONSTRAINT "PK_user_relationships_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_relationships_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_relationships_target_user_id" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "uq_user_relationship" UNIQUE ("user_id", "target_user_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_relationships_user" ON "user_relationships" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_relationships_target" ON "user_relationships" ("target_user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_relationships_status" ON "user_relationships" ("status")
    `);

    // user_permissions
    await queryRunner.query(`
      CREATE TABLE "user_permissions" (
        "id" BIGSERIAL NOT NULL,
        "user_id" BIGINT NOT NULL,
        "target_user_id" BIGINT NOT NULL,
        "permission" VARCHAR(50) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_user_permissions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_permissions_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_permissions_target_user_id" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "uq_user_permission" UNIQUE ("user_id", "target_user_id", "permission")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_permissions_user" ON "user_permissions" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_permissions_target" ON "user_permissions" ("target_user_id")
    `);

    // notification_settings
    await queryRunner.query(`
      CREATE TABLE "notification_settings" (
        "user_id" BIGINT NOT NULL,
        "new_content_enabled" BOOLEAN NOT NULL DEFAULT true,
        "recommendation_enabled" BOOLEAN NOT NULL DEFAULT true,
        "deadline_alert_enabled" BOOLEAN NOT NULL DEFAULT true,
        "recommendation_frequency" VARCHAR(20) NOT NULL DEFAULT 'DAILY',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_notification_settings" PRIMARY KEY ("user_id"),
        CONSTRAINT "FK_notification_settings_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // refresh_tokens
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" BIGSERIAL NOT NULL,
        "user_id" BIGINT NOT NULL,
        "token" VARCHAR(500) NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "revoked_at" TIMESTAMPTZ,
        CONSTRAINT "PK_refresh_tokens_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_refresh_tokens_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_refresh_tokens_user" ON "refresh_tokens" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_refresh_tokens_token" ON "refresh_tokens" ("token")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_refresh_tokens_expires" ON "refresh_tokens" ("expires_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_refresh_tokens_expires"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_refresh_tokens_token"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_refresh_tokens_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "notification_settings"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_permissions_target"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_permissions_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_permissions"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_relationships_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_relationships_target"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_relationships_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_relationships"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notifications_reference"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notifications_unread"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notifications_user_created"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_push_subscriptions_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_push_subscriptions_device"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_push_subscriptions_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "push_subscriptions"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "user_profiles"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "user_interests"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_data_sources_status"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "data_sources"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_contents_source"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_contents_organization"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_contents_application_end_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_contents_end_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_contents_start_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_contents_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_contents_type"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contents"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_user_organizations_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_user_organizations_org"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_organizations"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_organizations_location"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_organizations_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_organizations_type"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "organizations"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_social_accounts_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_social_accounts"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_status"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
