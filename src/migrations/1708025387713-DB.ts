import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1708025387713 implements MigrationInterface {
  name = 'DB1708025387713';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`notification_token\` DROP COLUMN \`device_type\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`notification_token\` ADD \`device_type\` enum ('iOS', 'Android', 'Web') NOT NULL DEFAULT 'Web'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`notification_token\` DROP COLUMN \`device_type\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`notification_token\` ADD \`device_type\` varchar(255) NOT NULL`,
    );
  }
}
