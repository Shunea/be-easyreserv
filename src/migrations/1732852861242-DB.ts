import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1732852861242 implements MigrationInterface {
  name = 'DB1732852861242';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add HOTEL to the place_type enum in the place table
    await queryRunner.query(
      `ALTER TABLE \`place\` MODIFY COLUMN \`place_type\` enum('RESTAURANT', 'BEAUTY_SALON', 'CAR_WASH', 'HOTEL') NOT NULL`
    );

    // Add HOTEL to the place_type enum in the plan table
    await queryRunner.query(
      `ALTER TABLE \`plan\` MODIFY COLUMN \`place_type\` enum('RESTAURANT', 'BEAUTY_SALON', 'CAR_WASH', 'HOTEL') NOT NULL DEFAULT 'RESTAURANT'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert the place_type enum in the place table
    await queryRunner.query(
      `ALTER TABLE \`place\` MODIFY COLUMN \`place_type\` enum('RESTAURANT', 'BEAUTY_SALON', 'CAR_WASH') NOT NULL`
    );

    // Revert the place_type enum in the plan table
    await queryRunner.query(
      `ALTER TABLE \`plan\` MODIFY COLUMN \`place_type\` enum('RESTAURANT', 'BEAUTY_SALON', 'CAR_WASH') NOT NULL DEFAULT 'RESTAURANT'`
    );
  }
} 