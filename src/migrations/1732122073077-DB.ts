import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1732122073077 implements MigrationInterface {
  name = 'DB1732122073077';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`category\` ADD \`name_ro\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`category\` ADD \`name_ru\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`product\` ADD \`title_ro\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`product\` ADD \`title_ru\` varchar(255) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`product\` DROP COLUMN \`title_ru\``);
    await queryRunner.query(`ALTER TABLE \`product\` DROP COLUMN \`title_ro\``);
    await queryRunner.query(`ALTER TABLE \`category\` DROP COLUMN \`name_ru\``);
    await queryRunner.query(`ALTER TABLE \`category\` DROP COLUMN \`name_ro\``);
  }
}
