import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1732852861238 implements MigrationInterface {
  name = 'DB1732852861238';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`order\` ADD \`creation_notice\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`order\` ADD \`deletion_notice\` varchar(255) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`order\` DROP COLUMN \`deletion_notice\``);
    await queryRunner.query(`ALTER TABLE \`order\` DROP COLUMN \`creation_notice\``);
  }
} 