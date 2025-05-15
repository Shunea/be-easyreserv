import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1710858240392 implements MigrationInterface {
  name = 'DB1710858240392';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`table\` ADD \`rotation_angle\` int NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`table\` DROP COLUMN \`rotation_angle\``,
    );
  }
}
