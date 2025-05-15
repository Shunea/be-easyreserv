import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1718008157382 implements MigrationInterface {
  name = 'DB1718008157382';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`order\` ADD \`status\` enum ('CANCELLED', 'COMPLETED', 'PENDING', 'PREPARING', 'READY') NOT NULL DEFAULT 'PENDING'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` CHANGE \`role\` \`role\` enum ('SUPER_ADMIN', 'ADMIN', 'USER', 'BARTENDER', 'CHEF', 'DRIVER', 'HOSTESS', 'OPERATOR', 'SOUS_CHEF', 'SPECIALIST', 'SUPER_HOSTESS', 'WAITER') NOT NULL DEFAULT 'USER'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` CHANGE \`role\` \`role\` enum ('SUPER_ADMIN', 'ADMIN', 'USER', 'WAITER', 'CHEF', 'HOSTESS', 'SUPER_HOSTESS', 'OPERATOR', 'SPECIALIST', 'DRIVER') NOT NULL DEFAULT 'USER'`,
    );
    await queryRunner.query(`ALTER TABLE \`order\` DROP COLUMN \`status\``);
  }
}
