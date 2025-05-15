import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1708096602841 implements MigrationInterface {
  name = 'DB1708096602841';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` CHANGE \`language\` \`language\` enum ('en', 'ro', 'ru') NOT NULL DEFAULT 'en'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` CHANGE \`language\` \`language\` enum ('en', 'ro') NOT NULL DEFAULT 'en'`,
    );
  }
}
