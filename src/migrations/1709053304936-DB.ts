import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1709053304936 implements MigrationInterface {
  name = 'DB1709053304936';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`reservation\` CHANGE \`status\` \`status\` enum ('CANCELLED', 'CLOSED', 'CONFIRMED', 'CONFIRMED_PREORDER', 'DISHONORED', 'PENDING', 'PENDING_PREORDER', 'REJECTED', 'SERVE', 'SERVE_PREORDER ') NOT NULL DEFAULT 'PENDING'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`reservation\` CHANGE \`status\` \`status\` enum ('CANCELLED', 'CLOSED', 'CONFIRMED', 'CONFIRMED_PREORDER', 'DISHONORED', 'PENDING', 'PENDING_PREORDER', 'REJECTED', 'SERVE') NOT NULL DEFAULT 'PENDING'`,
    );
  }
}
