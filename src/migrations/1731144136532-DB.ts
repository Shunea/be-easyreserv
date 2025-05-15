import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1731144136532 implements MigrationInterface {
  name = 'DB1731144136532';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`communication\` ADD \`title_en\` text NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`communication\` ADD \`title_ro\` text NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`communication\` ADD \`title_ru\` text NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`communication\` ADD \`message_en\` text NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`communication\` ADD \`message_ro\` text NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`communication\` ADD \`message_ru\` text NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`communication\` DROP COLUMN \`message_ru\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`communication\` DROP COLUMN \`message_ro\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`communication\` DROP COLUMN \`message_en\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`communication\` DROP COLUMN \`title_ru\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`communication\` DROP COLUMN \`title_ro\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`communication\` DROP COLUMN \`title_en\``,
    );
  }
}
