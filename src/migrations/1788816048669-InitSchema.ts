import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1788816048669 implements MigrationInterface {
  name = 'InitSchema1788816048669';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "api_keys" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "hashedKey" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid, CONSTRAINT "UQ_0d632a6c3b16bc708bf0987fed2" UNIQUE ("hashedKey"), CONSTRAINT "PK_5c8a79801b44bd27b79228e1dad" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."upload_jobs_status_enum" AS ENUM('pending', 'queued', 'processing', 'completed', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "upload_jobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "idempotencyKey" character varying NOT NULL, "originalFilename" character varying NOT NULL, "storagePath" character varying NOT NULL, "status" "public"."upload_jobs_status_enum" NOT NULL DEFAULT 'pending', "attempts" integer NOT NULL DEFAULT '0', "errorMessage" text, "result" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid, CONSTRAINT "PK_34cc4b2ed56792958d2b85650a1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b17b271cde7f08c42251b297f9" ON "upload_jobs"  ("organizationId", "idempotencyKey") `,
    );
    await queryRunner.query(
      `ALTER TABLE "api_keys" ADD CONSTRAINT "FK_1888b4544f52d274e98f6f1aa62" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "upload_jobs" ADD CONSTRAINT "FK_c885b30f99546ce4b224adbd874" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "upload_jobs" DROP CONSTRAINT "FK_c885b30f99546ce4b224adbd874"`,
    );
    await queryRunner.query(
      `ALTER TABLE "api_keys" DROP CONSTRAINT "FK_1888b4544f52d274e98f6f1aa62"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b17b271cde7f08c42251b297f9"`,
    );
    await queryRunner.query(`DROP TABLE "upload_jobs"`);
    await queryRunner.query(`DROP TYPE "public"."upload_jobs_status_enum"`);
    await queryRunner.query(`DROP TABLE "api_keys"`);
    await queryRunner.query(`DROP TABLE "organizations"`);
  }
}
