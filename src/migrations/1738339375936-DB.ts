import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1738339375936 implements MigrationInterface {
  name = 'DB1738339375936';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, modify the enum type to include the new value
    await queryRunner.query(
      `ALTER TABLE \`product\` MODIFY COLUMN \`preparation_zone\` enum ('Hot', 'Cold', 'Fish', 'Grill', 'Desert', 'Bar', 'Hookah') NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert back to the original enum without 'Hookah'
    await queryRunner.query(
      `ALTER TABLE \`product\` MODIFY COLUMN \`preparation_zone\` enum ('Hot', 'Cold', 'Fish', 'Grill', 'Desert', 'Bar') NOT NULL`,
    );
  }
} 