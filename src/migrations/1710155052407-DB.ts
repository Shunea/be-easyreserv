import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1710155052407 implements MigrationInterface {
  name = 'DB1710155052407';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`restaurant\` ADD \`is_hidden\` tinyint NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`restaurant\` DROP COLUMN \`is_hidden\``,
    );
  }
}
