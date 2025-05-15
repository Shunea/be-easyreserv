import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1730736824406 implements MigrationInterface {
  name = 'DB1730736824406';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`placement\` ADD \`user_id\` varchar(255) NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`placement\` DROP COLUMN \`user_id\``,
    );
  }
}
