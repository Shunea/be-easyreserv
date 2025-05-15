import { MigrationInterface, QueryRunner } from 'typeorm';

export class DB1712326255276 implements MigrationInterface {
  name = 'DB1712326255276';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`bonus\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`type\` enum ('SIMPLE', 'VIP') NOT NULL DEFAULT 'SIMPLE', \`restaurant_id\` varchar(255) NOT NULL, \`user_id\` varchar(255) NOT NULL, INDEX \`IDX_99adaf1e64ddd7320cf6e0d92d\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`bonus\` ADD CONSTRAINT \`FK_99adaf1e64ddd7320cf6e0d92de\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`bonus\` DROP FOREIGN KEY \`FK_99adaf1e64ddd7320cf6e0d92de\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_99adaf1e64ddd7320cf6e0d92d\` ON \`bonus\``,
    );
    await queryRunner.query(`DROP TABLE \`bonus\``);
  }
}
