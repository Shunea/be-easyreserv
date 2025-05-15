import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1730559708545 implements MigrationInterface {
  name = 'DB1730559708545';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`salary_type\` enum ('MONTHLY', 'HOURLY') NOT NULL DEFAULT 'MONTHLY'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`currency\` enum ('USD', 'EUR', 'MDL', 'RON') NOT NULL DEFAULT 'MDL'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`salary_type\``);
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`currency\``);
  }
}
