import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1730888843193 implements MigrationInterface {
  name = 'DB1730888843193';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`placement\` DROP COLUMN \`text\``);
    await queryRunner.query(
      `ALTER TABLE \`placement\` ADD \`text_en\` text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`placement\` ADD \`text_ro\` text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`placement\` ADD \`text_ru\` text NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`placement\` DROP COLUMN \`text_ru\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`placement\` DROP COLUMN \`text_ro\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`placement\` DROP COLUMN \`text_en\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`placement\` ADD \`text\` text NOT NULL`,
    );
  }
}
