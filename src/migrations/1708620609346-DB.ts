import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1708620609346 implements MigrationInterface {
  name = 'DB1708620609346';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` CHANGE \`role\` \`role\` enum ('SUPER_ADMIN', 'ADMIN', 'USER', 'WAITER', 'CHEF', 'HOSTESS', 'SUPER_HOSTESS', 'OPERATOR', 'SPECIALIST') NOT NULL DEFAULT 'USER'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` CHANGE \`role\` \`role\` enum ('SUPER_ADMIN', 'ADMIN', 'USER', 'WAITER', 'CHEF', 'HOSTESS', 'OPERATOR', 'SPECIALIST') NOT NULL DEFAULT 'USER'`,
    );
  }
}
