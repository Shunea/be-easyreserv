import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class DB1732852861237 implements MigrationInterface {
    name = 'DB1732852861237'
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`qr_code\` ADD COLUMN \`phone_number\` varchar(255) NULL`
    );
    await queryRunner.query(
      `ALTER TABLE \`qr_code\` ADD COLUMN \`longitude\` varchar(255) NULL`
    );
    await queryRunner.query(
      `ALTER TABLE \`qr_code\` ADD COLUMN \`latitude\` varchar(255) NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`qr_code\` DROP COLUMN \`phone_number\``);
    await queryRunner.query(`ALTER TABLE \`qr_code\` DROP COLUMN \`longitude\``);
    await queryRunner.query(`ALTER TABLE \`qr_code\` DROP COLUMN \`latitude\``);
  }
}