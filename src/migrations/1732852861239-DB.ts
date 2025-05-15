import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1732852861239 implements MigrationInterface {
  name = 'DB1732852861239';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`order\` ADD \`service_type\` enum('ON_SITE', 'TAKE_AWAY') NOT NULL DEFAULT 'ON_SITE'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`order\` ADD \`course_type\` enum('COURSE_1', 'COURSE_2', 'COURSE_3', 'COURSE_4', 'COURSE_5', 'COURSE_6', 'VIP_COURSE') NOT NULL DEFAULT 'COURSE_1'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`order\` ADD \`doneness\` enum('RARE', 'MEDIUM_RARE', 'MEDIUM', 'MEDIUM_WELL', 'WELL_DONE') NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`order\` DROP COLUMN \`doneness\``);
    await queryRunner.query(`ALTER TABLE \`order\` DROP COLUMN \`course_type\``);
    await queryRunner.query(`ALTER TABLE \`order\` DROP COLUMN \`service_type\``);
  }
} 