import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1732852861243 implements MigrationInterface {
  name = 'DB1732852861243';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add hotelId column to user table
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`hotel_id\` varchar(36) NULL`
    );

    // Add foreign key constraint
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD CONSTRAINT \`FK_user_hotel_id\` FOREIGN KEY (\`hotel_id\`) REFERENCES \`place\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`
    );

    // Add index for better query performance
    await queryRunner.query(
      `CREATE INDEX \`IDX_user_hotel_id\` ON \`user\` (\`hotel_id\`)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove index
    await queryRunner.query(
      `DROP INDEX \`IDX_user_hotel_id\` ON \`user\``
    );

    // Remove foreign key constraint
    await queryRunner.query(
      `ALTER TABLE \`user\` DROP FOREIGN KEY \`FK_user_hotel_id\``
    );

    // Remove hotelId column
    await queryRunner.query(
      `ALTER TABLE \`user\` DROP COLUMN \`hotel_id\``
    );
  }
} 