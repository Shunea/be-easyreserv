import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1712244584213 implements MigrationInterface {
  name = 'DB1712244584213';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`notification\` ADD \`placeholder\` json NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`notification\` DROP COLUMN \`placeholder\``,
    );
  }
}
