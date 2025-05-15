import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1709020975641 implements MigrationInterface {
  name = 'DB1709020975641';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`is_google_auth\` tinyint NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` DROP COLUMN \`is_google_auth\``,
    );
  }
}
