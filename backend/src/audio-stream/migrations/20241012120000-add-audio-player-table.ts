import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAudioPlayerTable20241012120000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "audio_player" (
        "id" varchar PRIMARY KEY,
        "name" text NULL,
        "size" integer NOT NULL DEFAULT 0,
        "duration" integer NOT NULL DEFAULT 0,
        "isPlaying" boolean NOT NULL DEFAULT true,
        "createdAt" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        "streamId" varchar NULL
      )`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "audio_player"`);
  }
}