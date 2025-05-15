import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1711624923942 implements MigrationInterface {
  name = 'DB1711624923942';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`is_apple_auth\` tinyint NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` DROP COLUMN \`is_apple_auth\``,
    );
  }
}
