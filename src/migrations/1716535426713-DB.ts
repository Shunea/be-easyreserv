import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1716535426713 implements MigrationInterface {
  name = 'DB1716535426713';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`product\` ADD \`preparation_zone\` enum ('Hot', 'Cold', 'Fish', 'Grill', 'Desert', 'Bar') NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`product\` ADD \`preparation_time\` int NULL`,
    );
    await queryRunner.query(`ALTER TABLE \`product\` ADD \`recipe\` text NULL`);
    await queryRunner.query(
      `ALTER TABLE \`product\` ADD \`allergens\` varchar(255) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`product\` DROP COLUMN \`allergens\``,
    );
    await queryRunner.query(`ALTER TABLE \`product\` DROP COLUMN \`recipe\``);
    await queryRunner.query(
      `ALTER TABLE \`product\` DROP COLUMN \`preparation_time\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`product\` DROP COLUMN \`preparation_zone\``,
    );
  }
}
