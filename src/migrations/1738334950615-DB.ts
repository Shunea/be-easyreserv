import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1738334950615 implements MigrationInterface {
  name = 'DB1738334950615';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add TVA type column
    await queryRunner.query(
      `ALTER TABLE \`product\` ADD \`tva_type\` varchar(1) NOT NULL DEFAULT 'A'`,
    );

    // Add TVA percentage column
    await queryRunner.query(
      `ALTER TABLE \`product\` ADD \`tva_percentage\` decimal(5,2) NOT NULL DEFAULT '20.00'`,
    );

    // Add masa netto column
    await queryRunner.query(
      `ALTER TABLE \`product\` ADD \`masa_netto\` decimal(10,2) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`product\` DROP COLUMN \`masa_netto\``);
    await queryRunner.query(`ALTER TABLE \`product\` DROP COLUMN \`tva_percentage\``);
    await queryRunner.query(`ALTER TABLE \`product\` DROP COLUMN \`tva_type\``);
  }
} 