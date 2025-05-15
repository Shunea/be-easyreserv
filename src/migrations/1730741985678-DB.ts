import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1730741985678 implements MigrationInterface {
  name = 'DB1730741985678';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`placement\` ADD \`userId\` varchar(36) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`placement\` ADD CONSTRAINT \`FK_cde4bea9871e39e9e86a26c4300\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`placement\` DROP FOREIGN KEY \`FK_cde4bea9871e39e9e86a26c4300\``,
    );
    await queryRunner.query(`ALTER TABLE \`placement\` DROP COLUMN \`userId\``);
  }
}
